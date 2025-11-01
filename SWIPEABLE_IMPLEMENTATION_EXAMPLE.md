# Example: Using SwipeableItemCard in NotesView

This example shows how to integrate the new swipeable interactions into your existing NotesView component.

## Step 1: Import the new component

\`\`\`tsx
// Replace ItemCard import with SwipeableItemCard
import { SwipeableItemCard } from "./SwipeableItemCard";
\`\`\`

## Step 2: Add handler functions

Add these to your parent component (e.g., `page.tsx` or wherever NotesView is used):

\`\`\`tsx
const handleArchive = async (id: string) => {
  try {
    const { error } = await supabase
      .from('items')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    
    // Refresh items
    await fetchItems();
    
    // Optional: Show success toast
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast?.success('Item archived');
    }
  } catch (error) {
    console.error('Error archiving item:', error);
  }
};

const handleUnarchive = async (id: string) => {
  try {
    const { error } = await supabase
      .from('items')
      .update({ archived_at: null })
      .eq('id', id);
    
    if (error) throw error;
    
    await fetchItems();
  } catch (error) {
    console.error('Error unarchiving item:', error);
  }
};

const handlePin = async (id: string) => {
  try {
    // First, check if the item is already pinned
    const { data: currentItem } = await supabase
      .from('items')
      .select('pinned')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('items')
      .update({ pinned: !currentItem?.pinned })
      .eq('id', id);
    
    if (error) throw error;
    
    await fetchItems();
    
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast?.success(
        !currentItem?.pinned ? 'Item pinned' : 'Item unpinned'
      );
    }
  } catch (error) {
    console.error('Error pinning item:', error);
  }
};

const handleShare = async (item: ItemWithDetails) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: item.title,
        text: item.description || item.title,
        // Optional: Add URL if you have individual item pages
        // url: \`\${window.location.origin}/items/\${item.id}\`
      });
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  } else {
    // Fallback for browsers without Web Share API
    // Copy to clipboard
    const shareText = \`\${item.title}\${item.description ? '\\n' + item.description : ''}\`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      if (typeof window !== 'undefined' && 'toast' in window) {
        (window as any).toast?.success('Copied to clipboard');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }
};
\`\`\`

## Step 3: Update NotesView component

\`\`\`tsx
interface NotesViewProps {
  items: ItemWithDetails[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: ItemWithDetails) => void;
  onDelete: (id: string) => void;
  onView: (item: ItemWithDetails) => void;
  // Add new props
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onPin?: (id: string) => void;
  onShare?: (item: ItemWithDetails) => void;
  viewDensity?: "compact" | "comfy";
  showArchived?: boolean;
}

export function NotesView({ 
  items, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onView,
  onArchive,
  onUnarchive,
  onPin,
  onShare,
  viewDensity = "comfy", 
  showArchived = false 
}: NotesViewProps) {
  // ... existing code ...

  return (
    <div className="space-y-4 pb-24">
      {/* ... existing header ... */}

      {/* Notes List */}
      <div className="space-y-2">
        {openNotes.length === 0 ? (
          // ... empty state ...
        ) : (
          openNotes.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SwipeableItemCard
                item={item}
                onToggleComplete={onToggleComplete}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                onPin={onPin}
                onShare={onShare}
                viewDensity={viewDensity}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Completed Notes Section - also use SwipeableItemCard */}
      {completedNotes.length > 0 && (
        <motion.div className="mt-6">
          {/* ... collapsible header ... */}
          
          <AnimatePresence>
            {!collapsedSections.has('completed') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-2 overflow-hidden"
              >
                {completedNotes.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <SwipeableItemCard
                      item={item}
                      onToggleComplete={onToggleComplete}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onArchive={onArchive}
                      onUnarchive={onUnarchive}
                      onPin={onPin}
                      onShare={onShare}
                      viewDensity={viewDensity}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Archived Notes - use SwipeableItemCard with unarchive */}
      {showArchived && archivedNotes.length > 0 && (
        <motion.div className="mt-6">
          {/* ... collapsible header ... */}
          
          <AnimatePresence>
            {!collapsedSections.has('archived') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-2 overflow-hidden"
              >
                {archivedNotes.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <SwipeableItemCard
                      item={item}
                      onToggleComplete={onToggleComplete}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onUnarchive={onUnarchive} // For archived items, use unarchive
                      onPin={onPin}
                      onShare={onShare}
                      viewDensity={viewDensity}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
\`\`\`

## Step 4: Database Schema Updates (Optional)

If you want to use the Pin functionality, add a `pinned` column:

\`\`\`sql
-- Add pinned column to items table
ALTER TABLE items 
ADD COLUMN pinned BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX idx_items_pinned ON items(pinned) WHERE pinned = TRUE;
\`\`\`

## Step 5: Pass handlers from parent component

In your main `page.tsx`:

\`\`\`tsx
<NotesView
  items={items}
  onToggleComplete={handleToggleComplete}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
  onArchive={handleArchive}        // NEW!
  onUnarchive={handleUnarchive}    // NEW!
  onPin={handlePin}                // NEW!
  onShare={handleShare}            // NEW!
  viewDensity={viewDensity}
  showArchived={showArchived}
/>
\`\`\`

## Testing the Features

### Test Swipe Right
1. Find an active note
2. Swipe right across the card
3. Should mark as complete with green background feedback

### Test Swipe Left
1. Swipe left on any card
2. Should reveal action menu with Edit, Delete, Archive, Share, Pin buttons
3. Tap any button to execute
4. Tap X to close

### Test Long Press
1. Press and hold on a card for 500ms
2. Should open floating action menu
3. Should feel haptic vibration (on supported devices)

### Test Archive
1. Complete a note first
2. Swipe right on completed note
3. Should archive it with orange background feedback

### Test Share
1. Swipe left or long press
2. Tap Share button
3. Should open native share dialog (mobile) or copy to clipboard (desktop)

## Gradual Migration Strategy

You can migrate gradually:

### Phase 1: Test in one view
Start with just NotesView using SwipeableItemCard

### Phase 2: Get feedback
Observe user behavior and gather feedback

### Phase 3: Roll out to other views
Apply to RemindersView, EventsView, etc.

### Phase 4: Remove old ItemCard
Once confident, remove the old ItemCard component

## Tips for Success

1. **Show a tutorial on first use**: Use a tooltip or modal to explain swipe gestures
2. **Keep the hint text**: "← Swipe for actions" helps discoverability
3. **Monitor analytics**: Track gesture usage vs. traditional taps
4. **Collect feedback**: Ask users about the new interactions
5. **A/B test**: Consider testing with a subset of users first

## Common Issues & Solutions

### Issue: Swipe interferes with scroll
**Solution**: The component uses `touch-pan-y` class to allow vertical scrolling while enabling horizontal swipes.

### Issue: Accidental triggers
**Solution**: The 100px threshold prevents accidental swipes. Adjust if needed.

### Issue: Share doesn't work
**Solution**: Check if `navigator.share` is available. Fallback to clipboard works on desktop.

### Issue: Haptics don't work
**Solution**: Haptic feedback only works in PWA mode or native browsers. Web views may not support it.

## Performance Optimization

For lists with many items:

\`\`\`tsx
// Use React.memo to prevent unnecessary re-renders
export const SwipeableItemCard = React.memo(function SwipeableItemCard({ ... }) {
  // ... component code
});

// Or use virtualization for 100+ items
import { VirtualList } from 'some-virtualization-library';
\`\`\`

---

**That's it!** You now have a modern, gesture-driven interface that feels like a native app. 🎉
