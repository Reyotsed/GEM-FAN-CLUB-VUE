// Lightweight reactive store to trigger the global UserProfileCardModal
// from any component (including non-Vue helpers). No external deps.
import { reactive } from 'vue';

export const userCardStore = reactive({
  userId: '',
  openSeq: 0, // increment to re-trigger watcher even with same userId
});

/**
 * Show the user profile card modal for given userId.
 */
export function showUserCard(userId) {
  if (!userId) return;
  userCardStore.userId = String(userId);
  userCardStore.openSeq += 1;
}
