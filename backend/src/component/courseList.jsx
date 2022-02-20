import { ApiClient } from "adminjs";
import { Box } from "@adminjs/design-system";
import { useState, useEffect } from "react";
const api = new ApiClient();

const courses = [1,2,3]
console.log("hello world");

const courseList = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    api.getDashboard().then((response) => {
      setData(response.data);
    });
  }, []);

  return (
    <Box variant="grey">
      <Box variant="white">
        <div>
            {courses.map((num) => (
                <h3 key={num}>{num}</h3>
            ))}
        </div>
      </Box>
    </Box>
  );
};

export default courseList;
