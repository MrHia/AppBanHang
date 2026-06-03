import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { authApi } from 'src/api';

const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT',
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;
    return {
      ...state,
      ...(user
        ? { isAuthenticated: true, isLoading: false, user }
        : { isLoading: false }),
    };
  },
  [HANDLERS.SIGN_IN]: (state, action) => ({ ...state, isAuthenticated: true, user: action.payload, isLoading: false }),
  [HANDLERS.SIGN_OUT]: (state) => ({ ...state, isAuthenticated: false, user: null }),
};

const reducer = (state, action) => handlers[action.type] ? handlers[action.type](state, action) : state;

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  const initialize = async () => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const token = window.sessionStorage.getItem('token');
      const userStr = window.sessionStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        dispatch({ type: HANDLERS.INITIALIZE, payload: user });
        return;
      }
    } catch (err) { console.error(err); }
    dispatch({ type: HANDLERS.INITIALIZE });
  };

  useEffect(() => { initialize(); }, []);

  const signIn = async (email, password) => {
    const res = await authApi.login(email, password);
    const user = res; // interceptor đã unwrap ApiResponse wrapper rồi
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleName: user.roleName,
      siteId: user.siteId,
      siteCode: user.siteCode,
      mustChangePassword: user.mustChangePassword || false,
      token: user.token
    };
    window.sessionStorage.setItem('token', user.token);
    window.sessionStorage.setItem('user', JSON.stringify(userData));
    dispatch({ type: HANDLERS.SIGN_IN, payload: userData });
    return userData;
  };

  const signOut = () => {
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('user');
    dispatch({ type: HANDLERS.SIGN_OUT });
  };

  // Cập nhật một phần thông tin user đang đăng nhập (vd: sau khi đổi mật khẩu xong,
  // clear cờ mustChangePassword) — đồng bộ cả sessionStorage để reload không mất.
  const updateUser = (partial) => {
    const updated = { ...state.user, ...partial };
    window.sessionStorage.setItem('user', JSON.stringify(updated));
    dispatch({ type: HANDLERS.SIGN_IN, payload: updated });
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthConsumer = AuthContext.Consumer;
export const useAuth = () => useContext(AuthContext);
