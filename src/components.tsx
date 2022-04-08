import React, { ReactElement, useEffect, useRef, useState } from "react";
import {
  useRoutes,
  createRoutesFromChildren,
  Path,
  Route as ReactRouterRoute,
  RouteProps as ReactRouterRouteProps,
  useNavigate,
  NavigateFunction,
  Location
} from "react-router-dom";

interface Middleware {
  (args: {
    state: State;
    actions: Actions;
    next: () => void;
    redirect: () => void;
  }): void;
}

interface RouteProps extends ReactRouterRouteProps {
  middlewares?: Middleware[];
}

const executeMiddlewares = async (
  route: ReactElement,
  getArgs: () => {
    state?: State;
    actions?: Actions;
    navigate: NavigateFunction;
  },
  index = 0
): Promise<boolean> => {
  return new Promise(async (res, rej) => {
    if (!route || !route.props?.middlewares) {
      return res(true);
    }

    const { middlewares } = route.props;
    if (index >= middlewares.length) {
      return res(true);
    }

    const { navigate, state, actions } = getArgs();
    let wasNextCalled = false;
    const next = () => {
      wasNextCalled = true;
    };

    const redirect = (path: Path) => {
      navigate(path, { replace: true });
    };

    const middleware = middlewares[index];

    await middleware({
      redirect,
      next,
      state,
      actions
    });

    if (!wasNextCalled) return res(false);
    return res(executeMiddlewares(route, getArgs, index + 1));
  });
};

type State = Record<string, unknown>;
type Actions = Record<string, () => unknown>;

export const Routes: React.FC<{
  state?: State;
  actions?: Actions;
  location?: Location;
}> = ({ children, state, actions, location }) => {
  const [rendering, setRendering] = useState<ReactElement | null>(null);
  const navigate = useNavigate();
  const route = useRoutes(createRoutesFromChildren(children), location);

  const argsRef = useRef<{
    state?: State;
    actions?: Actions;
    navigate: NavigateFunction;
  } | null>(null);

  useEffect(() => {
    argsRef.current = {
      state,
      actions,
      navigate
    };
  }, [state, actions, navigate]);

  useEffect(() => {
    const args = argsRef.current;
    if (!route || !args) return;

    const exectute = async () => {
      const result = await executeMiddlewares(route, () => args);

      console.log(result);
      if (result)
        setRendering((current) => {
          if (!current || (result && route.props?.path === current.props?.path))
            return route;
          return current;
        });
    };

    exectute();
  }, [route]);

  return rendering;
};

export const Route = ReactRouterRoute as React.FC<RouteProps>;
