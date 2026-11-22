// The public web build uses browser APIs; Toss keeps its native SDK.
export const isBrowserBuild = import.meta.env.MODE === 'web';
