const {useState, useRef, useEffect, useContext, createContext} = React;

// CREATING ROUTER CONTEXT AND CUSTOM HOOK useRouter() TO ALLOW CHILD COMPONENTS GET CONTEXT VALUE FROM ROUTER COMPONENT

const RouterContext = createContext(null);
function useRouter() {
    const ctx = useContext(RouterContext);
    if (!ctx) {
        throw new Error("RouterContext can't be used outside <Router></Router>")
    }
    return ctx;
}

const kRouter = {
    Router({children}) {
        const [path, setPath] = useState(window.location.pathname);
        useEffect(() => {
            const onPopState = () => {
                setPath(window.location.pathname);
            }
            window.addEventListener("popstate", onPopState);
            return () => {
                window.removeEventListener("popstate", onPopState)
            }
        }, []);
        const goTo = (to) => {
            if (to === path ) {
                return;
            }
            window.history.pushState({}, "", to);
            const popstate = new PopStateEvent('popstate');
            window.dispatchEvent(popstate);
        }
        const routes = React.Children.toArray(children);
        const activeRoute = routes.find(route => route.props.path === path );
        const routerContextValue = {path, goTo};
        
        return (
            <RouterContext.Provider value={routerContextValue}>
                { activeRoute ? activeRoute.props.children : <h1> 404 Not Found!</h1>}
            </RouterContext.Provider>
        )
    },
    Route({path}) {return null;},
    Link({to, children}) {
        //const [active, setActive] = useState(to === window.location.pathname);
        const onClick = (e) => {
            e.preventDefault();
            if(to === window.location.pathname) {
                return
            }
            window.history.pushState({}, "", to);
            window.dispatchEvent(new PopStateEvent("popstate"));
        }
        return (
            <a href={to} onClick={onClick}>{children} </a>
        );
    }
}