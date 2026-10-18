/**
 * Universal Dialog & Toast Singleton Manager
 * Allows triggering toasts, confirmations, alerts, and prompts from anywhere in the app
 * seamlessly without prop drilling or hook restrictions.
 */

class DialogManager {
  constructor() {
    this._handler = null;
    this._queue = [];
  }

  register(handler) {
    this._handler = handler;
    // Process any queued calls
    while (this._queue.length > 0) {
      const { method, args, resolve } = this._queue.shift();
      if (this._handler && typeof this._handler[method] === 'function') {
        const result = this._handler[method](...args);
        resolve(result);
      }
    }
  }

  unregister() {
    this._handler = null;
  }

  _call(method, ...args) {
    if (this._handler && typeof this._handler[method] === 'function') {
      return this._handler[method](...args);
    }
    // If called before provider mounts, return promise and queue
    return new Promise((resolve) => {
      this._queue.push({ method, args, resolve });
    });
  }

  confirm(options) {
    return this._call('showConfirm', options);
  }

  alert(options) {
    return this._call('showAlert', options);
  }

  prompt(options) {
    return this._call('showPrompt', options);
  }

  toast(options) {
    return this._call('showToast', options);
  }

  close() {
    return this._call('closeDialog');
  }
}

export const dialog = new DialogManager();

// Convenient shorthand helpers on dialog.toast
dialog.toast.success = (title, message, duration = 3000) => {
  return dialog.toast({
    title,
    message,
    type: 'success',
    duration,
  });
};

dialog.toast.error = (title, message, duration = 4000) => {
  return dialog.toast({
    title,
    message,
    type: 'error',
    duration,
  });
};

dialog.toast.warning = (title, message, duration = 3500) => {
  return dialog.toast({
    title,
    message,
    type: 'warning',
    duration,
  });
};

dialog.toast.info = (title, message, duration = 3000) => {
  return dialog.toast({
    title,
    message,
    type: 'info',
    duration,
  });
};

export default dialog;
