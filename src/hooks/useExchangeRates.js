const useExchangeRates = () => {
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchRates = async () => {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setRates(data.rates);
        setLoading(false);
      };
      fetchRates();
    }, []);
  
    return { rates, loading };
  };
  