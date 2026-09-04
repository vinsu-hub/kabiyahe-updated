// ELBI runs on Supabase Auth. The old Manus OAuth entrypoint is now just a
// redirect to the in-app sign-in page (kept as `startLogin` so existing callers
// don't need to change).
export const startLogin = () => {
  window.location.assign("/login");
};
