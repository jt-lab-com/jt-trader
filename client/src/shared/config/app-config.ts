const isDev = process.env.NODE_ENV === "development";

let config = {
  wsHost: "ws://localhost:8080",
};

if (!isDev) {
  config = {
    ...config,
    wsHost: "/",
  };
}

export default config;
