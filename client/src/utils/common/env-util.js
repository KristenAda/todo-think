const isLocal = import.meta.env.VITE_IS_LOCAL;
const isDev = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'testing';
const isProd = import.meta.env.MODE === 'production';

export { isLocal, isDev, isTest, isProd };
