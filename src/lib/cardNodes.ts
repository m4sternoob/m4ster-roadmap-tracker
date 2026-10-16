/**
 * Live registry of mounted card nodes, keyed by issue id.
 * Lets board-level motion (the card glide) measure cards without
 * prop-drilling refs through every column.
 */
export const cardNodes = new Map<string, HTMLElement>();
