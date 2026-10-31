import { 
  getAllCategoriesFromStore, 
  saveCategoryToStore, 
  deleteCategoryFromStore,
  getAllEventsFromStore,
  recordActivityToStore 
} from './services/persistenceService.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    // GET: List all categories with associated event count
    if (req.method === 'GET') {
      const categories = getAllCategoriesFromStore();
      const events = getAllEventsFromStore();

      const enriched = categories.map(cat => {
        const matchingEvents = events.filter(e => 
          e.category && (
            e.category.toLowerCase() === cat.name.toLowerCase() ||
            e.category.toLowerCase() === cat.slug.toLowerCase()
          )
        );
        return {
          ...cat,
          events_count: matchingEvents.length
        };
      });

      return res.status(200).json({ success: true, categories: enriched });
    }

    // POST: Create or Update Category or Reorder
    if (req.method === 'POST') {
      const { action, categories, category } = req.body || {};

      // Handle reordering array of categories
      if (action === 'reorder' && Array.isArray(categories)) {
        categories.forEach((item, index) => {
          saveCategoryToStore({
            ...item,
            display_order: index + 1
          });
        });

        recordActivityToStore({
          id: `act-cat-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'category_reordered',
          customer: 'Admin',
          status: 'success',
          details: 'Updated display order for customer-facing categories'
        });

        return res.status(200).json({ success: true, categories: getAllCategoriesFromStore() });
      }

      const catData = category || req.body;
      if (!catData.name) {
        return res.status(400).json({ success: false, error: 'Category name is required' });
      }

      const saved = saveCategoryToStore(catData);

      recordActivityToStore({
        id: `act-cat-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: catData.id ? 'category_updated' : 'category_created',
        customer: 'Admin',
        status: 'success',
        details: `Category "${saved.name}" (Slug: ${saved.slug}) saved with status ${saved.status}`
      });

      return res.status(200).json({ success: true, category: saved });
    }

    // DELETE: Check orphan safety before deactivate
    if (req.method === 'DELETE') {
      const { id } = req.body || req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'Category ID is required' });
      }

      const categories = getAllCategoriesFromStore();
      const target = categories.find(c => c.id === id || c.slug === id);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }

      const events = getAllEventsFromStore();
      const associatedEvents = events.filter(e => 
        e.category && (
          e.category.toLowerCase() === target.name.toLowerCase() ||
          e.category.toLowerCase() === target.slug.toLowerCase()
        )
      );

      // Requirement H: Before deleting a category, check whether events reference it. Do not orphan existing events.
      if (associatedEvents.length > 0) {
        // Deactivate safely rather than breaking links
        const deactivated = deleteCategoryFromStore(id);
        return res.status(200).json({
          success: true,
          archived: true,
          message: `Category "${target.name}" has ${associatedEvents.length} associated event(s). It has been deactivated to prevent orphaning events.`,
          category: deactivated
        });
      }

      const deleted = deleteCategoryFromStore(id);
      return res.status(200).json({ success: true, deleted: true, category: deleted });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[Admin Categories API Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
