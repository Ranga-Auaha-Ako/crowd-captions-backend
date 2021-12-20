import { ApiClient } from "adminjs";
import { Box } from "@adminjs/design-system";
import { useState, useEffect } from "react";
const api = new ApiClient();

const Dashboard = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    api.getDashboard().then((response) => {
      setData(response.data);
    });
  }, []);

  return (
    <Box variant="grey">
      <Box variant="white">
        <h1>hello world</h1>
      </Box>
    </Box>
  );
};

export default Dashboard;
