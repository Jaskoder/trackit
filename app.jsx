const {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef
} = React;
const { createRoot } = ReactDOM;
const { Router, Route, Link } = kRouter;
const home_path = window.location.pathname;
const formatNumber = (number) => number.toLocaleString("en-US");

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const timeDate = date.getDate(),
        month = date.getMonth() + 1;
    return `${timeDate}/${month}`
}

const alertBox = (callback, icon, message) => {
    callback({ icon, message });
}
const getTotalTransactions = (array) => array.reduce((acc, val) => acc + val.amount, 0);
const getSortedArray = (array) => {
    return [...array].sort((a, b) => b.time - a.time);
}
const loadTransactions = (type) => {
    try {
        const data = localStorage.getItem(type);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Error loading transactions ${type}`);
        return [];
    }
}

const saveTransactions = (type, data) => {
    try {
        localStorage.setItem(type, JSON.stringify(data));
    } catch (e) {
        console.error(`Error while saving ${data} to ${type}`);
    }
}
const addTransaction = (type, newTransaction) => {
    const updated = [...loadTransactions(type), newTransaction];
    saveTransactions(type, updated);
    return updated;
}
const editTransaction = (type, newTransaction, toEdit) => {
    const saved = loadTransactions(type);
    const index = saved.findIndex(({ amount, time }) => time == newTransaction.time && amount == newTransaction.amount);
    if (index !== null) {
        saved[index] = Object.assign(newTransaction, toEdit);
        saveTransactions(type, saved);
    }
    return saved;
}
const deleteTransaction = (type, transaction) => {
    const saved = loadTransactions(type);
    const index = saved.findIndex(({ amount, time }) => transaction.amount == amount && transaction.time == time);
    if (index !== null) {
        saved.splice(index, 1);
        saveTransactions(type, saved);
    }
    return saved;
}

function AlertBox({ icon, message }) {
    const icons = {
        success: "check-circle",
        error: "x-circle",
        warn: "exclamation-triangle",
        info: "info-circle"
    }
    return (
        <div className="alert-box">
            <span id={icon} className={`bi bi-${icons[icon]}`}></span>
            <p> {message} </p>
        </div>
    );
}

function ThemeBox({ theme, onChange, onClick }) {
    const themeCheckBoxes = [
        { name: "Blue Theme", className: 'blue-theme' },
        { name: "Dark Blue", className: 'dark-blue-theme' },
        { name: "Brown Theme", className: 'brown-theme' },
        { name: "Dark Brown", className: 'dark-brown-theme' }
    ];
    
    const handleThemeChange = (themeClassName) => {
        if (theme !== themeClassName) {
            onChange(themeClassName);
        }
    };
    
    return (
        <div className="theme-box">
            <button id="close-btn" className="bi bi-x" onClick={() => onClick(false)}></button>
            <h1> Choose a theme </h1>
            <div className="themes">
                {themeCheckBoxes.map(({ name, className }, i) => (
                    <div key={i} className={className}>
                        <label htmlFor={className}>{name}</label>
                        <span className="checkbox-wrapper">
                            <input
                                onChange={() => handleThemeChange(className)}
                                type="checkbox"
                                checked={theme === className}
                                id={className}
                            />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AddForm({ type, handleOperation }) {
    const [fieldsValue, setFieldsValue] = useState({ motive: "", amount: "" });
    const handleInput = ({ target }) => {
        const { name, value } = target;
        setFieldsValue(prev => ({
            ...prev,
            [name]: value,
        }));
    }
    const handleClick = () => {
        const data = {
            nature: type,
            motive: fieldsValue.motive.trim(),
            amount: Number(fieldsValue.amount),
            time: Date.now(),
        }
        handleOperation("add", type, data);
        setFieldsValue({ motive: "", amount: "" });
    }
    return (
        <div className="add-form">
            <label htmlFor="motive">Motive</label><label htmlFor="amount">Amount</label>
            <input name="motive" type="text" placeholder="Transaction motive" onInput={handleInput} value={fieldsValue.motive}></input>
            <input name="amount" type="number" placeholder="Transaction amount" onInput={handleInput} value={fieldsValue.amount}></input>
            <button disabled={!fieldsValue.amount || isNaN(Number(fieldsValue.amount)) || !fieldsValue.motive} onClick={handleClick}> Add to {type}</button>
        </div>
    )
}

function EditForm({ transaction, onCancel, handleOperation }) {
    const [transactionData, setTransactionData] = useState(transaction);
    const type = transaction.nature;
    const handleInput = (e) => {
        const { name, value } = e.target;
        setTransactionData(data => ({ ...data, [name]: name === "motive" ? value : Number(value) }));
    }
    
    return (
        <div className="edit-form">
            <label htmlFor="motive">Motive</label><label htmlFor="amount">Amount</label>
            <input name="motive" type="text" placeholder="Edit motive" onInput={handleInput} value={transactionData.motive}></input>
            <input name="amount" type="number" placeholder="Edit amount" onInput={handleInput} value={transactionData.amount}></input>
            <button disabled={!transactionData.motive || !transactionData.amount || isNaN(Number(transactionData.amount))} id="save" onClick={() => handleOperation("edit", type, transaction, transactionData)}>Save change</button>
            <button id="delete" onClick={() => handleOperation("delete", type, transaction)}>Delete</button>
            <button id="cancel" onClick={() => onCancel(false)}>Cancel</button>
        </div>
    )
}

function DashBoard({ incomes, outcomes }) {
    const [displayValues, setDisplayValues] = useState({
        income: 0,
        outcome: 0,
        balance: 0
    });
    
    useEffect(() => {
        const totalIncome = getTotalTransactions(incomes);
        const totalOutcome = getTotalTransactions(outcomes);
        const totalBalance = totalIncome - totalOutcome;
        
        const targets = {
            income: totalIncome,
            outcome: totalOutcome,
            balance: totalBalance
        };
        
        const duration = 800;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            setDisplayValues({
                income: Math.floor(targets.income * progress),
                outcome: Math.floor(targets.outcome * progress),
                balance: Math.floor(targets.balance * progress)
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValues(targets);
            }
        };
        
        const animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [incomes, outcomes]);
    
    return (
        <div className="monitor">
            <div className="income">
                <p className="p-title">Total Income</p>
                <p className="num-data">${formatNumber(displayValues.income)}</p>
            </div>
            <div className="outcome">
                <p className="p-title">Total Outcome</p>
                <p className="num-data">${formatNumber(displayValues.outcome)}</p>
            </div>
            <div className="balance">
                <p className="p-title">Net Balance</p>
                <p className="num-data">${formatNumber(displayValues.balance)}</p>
            </div>
        </div>
    );
}

function TransactionsList({ data, title, onClick, setToEdit }) {
    let pressTimer;
    const pressDuration = 600;
    
    const startPress = (e, trData) => {
        e.preventDefault();
        pressTimer = setTimeout(() => {
            setToEdit(trData);
            onClick(true);
        }, pressDuration);
    };
    
    const cancelPress = () => {
        if (pressTimer) clearTimeout(pressTimer);
    };
    
    return (
        <div className="transactions">
            <h1 className="title">{title}</h1>
            <div className="list">
                {data.length === 0 ? (
                    <h1 className="no-transaction-message">No transaction yet !!</h1>
                ) : (
                    data.map(({ time, amount, motive, nature }, i) => {
                        const trData = { time, nature, motive, amount };
                        return (
                            <li 
                                key={time+i}
                                id={time}
                                className={nature}
                                onMouseDown={(e) => startPress(e, trData)}
                                onMouseUp={cancelPress}
                                onMouseLeave={cancelPress}
                                onTouchStart={(e) => startPress(e, trData)}
                                onTouchEnd={cancelPress}
                            >
                                <span className="date">{formatDate(time)}</span>
                                <span className="t-motive">{motive}</span>
                                <span className="t-amount">${formatNumber(amount)}</span>
                            </li>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function NavBar() {
    const [activeRoute, setActiveRoute] = useState(window.location.pathname);
    const links = [
        { path: home_path, icon: "house", text: "Dashboard" },
        { path: "/incomes", icon: "cash-stack", text: "Income" },
        { path: "/outcomes", icon: "credit-card", text: "Outcome" }
    ];
    
    const goTo = (path) => {
        if (path === window.location.pathname) return;
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
        setActiveRoute(path);
    };
    
    return (
        <div className="nav-bar">
            {links.map(({ path, icon, text }, i) => (
                <a key={`link-${i}`} href={path}
                   className={activeRoute === path ? "active" : ""}
                   onClick={(e) => { e.preventDefault(); goTo(path); }}>
                    <span className={`bi bi-${icon}`}></span>
                    <span className="link">{text}</span>
                </a>
            ))}
        </div>
    );
}

function App() {
    const [theme, setTheme] = useState(localStorage.getItem("user-theme") || "brown-theme");
    const [buttonClick, setButtonClick] = useState(false);
    const [liClick, setLiClick] = useState(false);
    const [alert, setAlert] = useState({ icon: "", message: "" });
    const [transToEdit, setTransToEdit] = useState(null);
    
    const [incomes, setIncomes] = useState(() => loadTransactions("incomes"));
    const [outcomes, setOutcomes] = useState(() => loadTransactions("outcomes"));
    const sortedIncomes = useMemo(() => {
        return getSortedArray(incomes);
    }, [incomes]);
    const sortedOutcomes = useMemo(() => {
        return getSortedArray(outcomes);
    }, [outcomes])
    const allTransactions = useMemo(() => {
        return getSortedArray([...incomes, ...outcomes]);
    }, [incomes, outcomes]);
    
    useEffect(() => {
        localStorage.setItem("user-theme", theme);
        const appElement = document.querySelector(`.${theme}`);
        const metaTheme = document.getElementById("meta-theme");
        if (appElement && metaTheme) {
            const themeColor = getComputedStyle(appElement).getPropertyValue('--box-bg');
            metaTheme.setAttribute("content", themeColor.trim());
        }
    }, [theme]);
    
    useEffect(() => {
        const timeOutId = setTimeout(() => {
            setAlert({ icon: "", message: "" });
        }, 3000);
        return () => clearTimeout(timeOutId);
    }, [alert]);
    
    const handleAddEditOperation = (action, type, newTransaction = null, toEdit = null) => {
        if (action === "add") {
            try {
                if (type === "incomes") {
                    setIncomes(addTransaction(type, newTransaction));
                } else if (type === "outcomes") {
                    setOutcomes(addTransaction(type, newTransaction));
                }
                showAlert("success", `New transaction added to ${type}`);
            } catch (e) {
                showAlert("error", `Failed to ${action} transaction in ${type}`);
                console.error(`Failed to execute ${action} with ${newTransaction} on ${type}`, e);
            }
        } else if (action === "edit") {
            try {
                if (type === "incomes") {
                    setIncomes(editTransaction(type, newTransaction, toEdit));
                } else if (type === "outcomes") {
                    setOutcomes(editTransaction(type, newTransaction, toEdit))
                }
                showAlert("success", `Transation modified in ${type}`);
                setLiClick(false);
                setTransToEdit(null);
            }
            catch (e) {
                showAlert("error", `Failed to ${action} transaction in ${type}`);
                console.error(`Failed to execute ${action} with ${newTransaction} on ${type}`, e);
            }
        }
    }
    const handleDeleteOperation = (type, transaction) => {
        try {
            if (type === "incomes") {
                setIncomes(deleteTransaction(type, transaction));
            } else if (type === "outcomes") {
                setOutcomes(deleteTransaction(type, transaction));
            }
            showAlert("success", `Transaction deleted from ${type}`);
            setLiClick(false);
            setTransToEdit(null);
        } catch (e) {
            showAlert("error", `Failed to delete transaction in ${type}`);
            console.error(`Failed to delete transaction ${transaction} in ${type}`);
        }
    }
    const handleTransactionOps = useCallback((action, type, newTransaction = null, toEdit = null) => {
        if (action === "add" || action === "edit") {
            handleAddEditOperation(action, type, newTransaction, toEdit);
        } else if (action === "delete") {
            handleDeleteOperation(type, newTransaction);
        }
    }, []);
    const showAlert = (icon = "info", message) => {
        alertBox(setAlert, icon, message);
    }
    return (
        <div className={`app ${theme}`}>
            {buttonClick && <ThemeBox theme={theme} onChange={setTheme} onClick={setButtonClick}></ThemeBox>}
            {alert.message && <AlertBox icon={alert.icon} message={alert.message}></AlertBox>}
            {liClick && <EditForm transaction={transToEdit} onCancel={setLiClick} handleOperation={handleTransactionOps}></EditForm>}
            <Router>
                <Route path={home_path}>
                    <h1 className="title main">Dashboard</h1>
                    <DashBoard incomes={incomes} outcomes={outcomes}></DashBoard>
                    <TransactionsList title="Recent Transactions" data={allTransactions} onClick={setLiClick} setToEdit={setTransToEdit}></TransactionsList>
                </Route>
                <Route path="/incomes">
                    <h1 className="title main"> Incomes </h1>
                    <AddForm type="incomes" handleOperation={handleTransactionOps}></AddForm>
                    <TransactionsList title="Recent incomes" data={sortedIncomes} onClick={setLiClick} setToEdit={setTransToEdit}></TransactionsList>
                </Route>
                <Route path="/outcomes">
                    <h1 className="title main"> Outcomes </h1>
                    <AddForm type="outcomes" handleOperation={handleTransactionOps}></AddForm>
                    <TransactionsList title="Recent outcomes" data={sortedOutcomes} onClick={setLiClick} setToEdit={setTransToEdit}></TransactionsList>
                </Route>
            </Router>
            <button id="setting-btn" className="bi bi-gear" onClick={() => setButtonClick(!buttonClick)}></button>
            <NavBar></NavBar>
        </div>
    );
}

const root = document.getElementById("root");
const domRoot = createRoot(root);

domRoot.render(<App/>);
