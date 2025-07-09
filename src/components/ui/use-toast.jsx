import * as React from "react";

// הגדרת זמן תצוגה - 6 שניות (זמן ארוך יותר)
const TOAST_REMOVE_DELAY = 6000;
const TOAST_LIMIT = 5;

// משתנה גלובלי למעקב אחר מופעים של Toast וכן מעקב אחר בקשות אחרונות כדי למנוע כפילויות
if (typeof window !== 'undefined' && !window._toastInstances) {
  window._toastInstances = 0;
  window._lastToastMap = new Map(); // מעקב אחר הודעות אחרונות
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const toastTimeouts = new Map();

const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners = [];

let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// פונקציה לבדיקה האם קיימת כבר הודעה דומה במערכת
const isDuplicateToast = (title, description) => {
  if (typeof window === 'undefined' || !window._lastToastMap) return false;
  
  const key = `${title}|${description}`;
  const now = Date.now();
  const lastTime = window._lastToastMap.get(key);
  
  // אם יש הודעה דומה שנשלחה בפחות מ-3 שניות, זוהי כפילות
  if (lastTime && now - lastTime < 3000) {
    return true;
  }
  
  // שמירת זמן ההודעה הנוכחית
  window._lastToastMap.set(key, now);
  return false;
};

export function toast({ ...props }) {
  // בדיקה האם כבר יש מופע של toast עם אותה כותרת ותיאור פעיל
  // כדי למנוע כפילויות
  if (isDuplicateToast(props.title, props.description)) {
    return { id: null, dismiss: () => {}, update: () => {} };
  }

  const id = genId();

  const update = (props) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
        if (props.onOpenChange) props.onOpenChange(open);
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    // בדיקה למניעת כפילויות של רכיבי Toaster
    if (typeof window !== 'undefined') {
      window._toastInstances++;
      
      if (window._toastInstances > 1) {
        console.warn('Multiple Toaster instances detected. This may cause duplicate toast notifications.');
      }
      
      return () => {
        window._toastInstances--;
      };
    }
  }, []);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast as default };