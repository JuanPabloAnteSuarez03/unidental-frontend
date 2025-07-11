import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { customersService } from "../services/customersService";
import { useAuth } from "./AuthContext";

const CustomersContext = createContext();

export const useCustomers = () => {
    const context = useContext(CustomersContext);
    if (!context) {
        throw new Error("useCustomers must be used within a CustomersProvider");
    }
    return context;
};

export const CustomersProvider = ({ children }) => {
    const { authToken } = useAuth();
    const [customersCache, setCustomersCache] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [lastFetch, setLastFetch] = useState(null);
    const [error, setError] = useState(null);

    // Cache duration in milliseconds (5 minutes)
    const CACHE_DURATION = 5 * 60 * 1000;

    // Check if cache is still valid
    const isCacheValid = useCallback(() => {
        if (!lastFetch) return false;
        return Date.now() - lastFetch < CACHE_DURATION;
    }, [lastFetch, CACHE_DURATION]);

    // Load all customers and cache them
    const loadAllCustomers = useCallback(
        async (forceRefresh = false) => {
            if (!authToken) return;

            // If cache is valid and not forcing refresh, return cached data
            if (!forceRefresh && isCacheValid() && customersCache.length > 0) {
                return customersCache;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Load all customers with pagination handling
                const allCustomers = await customersService.getAllCustomers(
                    authToken
                );

                console.log(`Loaded ${allCustomers.length} customers`);

                setCustomersCache(allCustomers);
                setLastFetch(Date.now());
                setIsInitialized(true);

                return allCustomers;
            } catch (error) {
                console.error("Error loading customers:", error);
                setError(error.message || "Error al cargar clientes");
                return customersCache; // Return cached data on error
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, customersCache, isCacheValid]
    );

    // Search customers in cache
    const searchCustomers = useCallback(
        (searchTerm) => {
            if (!searchTerm || searchTerm.length < 2) {
                return [];
            }

            const term = searchTerm.toLowerCase().trim();

            const results = customersCache.filter((customer) => {
                const name = (customer.name || "").toLowerCase();
                const phone = (customer.phone || "").toLowerCase();
                const email = (customer.email || "").toLowerCase();

                return (
                    name.includes(term) ||
                    phone.includes(term) ||
                    email.includes(term)
                );
            });

            return results;
        },
        [customersCache]
    );

    // Add new customer to cache
    const addCustomerToCache = useCallback((newCustomer) => {
        setCustomersCache((prev) => {
            // Check if customer already exists
            const exists = prev.some(
                (customer) => customer.id === newCustomer.id
            );
            if (exists) {
                // Update existing customer
                return prev.map((customer) =>
                    customer.id === newCustomer.id ? newCustomer : customer
                );
            } else {
                // Add new customer and sort by name
                const updated = [...prev, newCustomer];
                return updated.sort((a, b) =>
                    (a.name || "").localeCompare(b.name || "")
                );
            }
        });
    }, []);

    // Update customer in cache
    const updateCustomerInCache = useCallback((updatedCustomer) => {
        setCustomersCache((prev) =>
            prev
                .map((customer) =>
                    customer.id === updatedCustomer.id
                        ? updatedCustomer
                        : customer
                )
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
    }, []);

    // Remove customer from cache
    const removeCustomerFromCache = useCallback((customerId) => {
        setCustomersCache((prev) =>
            prev.filter((customer) => customer.id !== customerId)
        );
    }, []);

    // Initialize cache when auth token is available
    useEffect(() => {
        if (authToken && !isInitialized) {
            loadAllCustomers();
        }
    }, [authToken, isInitialized, loadAllCustomers]);

    // Force refresh cache
    const refreshCache = useCallback(() => {
        return loadAllCustomers(true);
    }, [loadAllCustomers]);

    // Get cache status info
    const getCacheInfo = useCallback(() => {
        return {
            count: customersCache.length,
            isValid: isCacheValid(),
            lastFetch: lastFetch ? new Date(lastFetch).toLocaleString() : null,
            isLoading,
            isInitialized,
            error,
        };
    }, [
        customersCache.length,
        isCacheValid,
        lastFetch,
        isLoading,
        isInitialized,
        error,
    ]);

    const value = {
        // Data
        customersCache,
        isLoading,
        isInitialized,
        error,

        // Functions
        loadAllCustomers,
        searchCustomers,
        addCustomerToCache,
        updateCustomerInCache,
        removeCustomerFromCache,
        refreshCache,
        getCacheInfo,

        // Utils
        isCacheValid,
    };

    return (
        <CustomersContext.Provider value={value}>
            {children}
        </CustomersContext.Provider>
    );
};
