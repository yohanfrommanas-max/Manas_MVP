type AsyncCallback = () => Promise<void>;

let _appDataClearer: AsyncCallback = async () => {};

export const signOutRegistry = {
  register: (cb: AsyncCallback) => {
    _appDataClearer = cb;
  },
  clearAppData: () => _appDataClearer(),
};
