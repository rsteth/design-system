/** A central draft is only a fallback for unchanged app intent, never a redesign authority. */
export function assertDraftDirectionFresh(actual, snapshot, notes, savedNotes) {
 if (actual.direction !== undefined || snapshot?.direction?.status !== 'draft') return;
 const changed = ['title', 'summary', 'themes'].filter(key => JSON.stringify(actual[key]) !== JSON.stringify(snapshot[key]));
 const text = value => value == null ? null : value.toString();
 if (text(notes) !== text(savedNotes)) changed.push('public guide');
 if (changed.length) throw Error(`Central draft direction needs review: ${actual.id} (${changed.join(', ')} changed). Write the current direction in the app's design/collection.json, or explicitly remove the obsolete central draft before refreshing. Nothing was refreshed.`);
}
