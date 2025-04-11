import axios from 'axios';
import { PREFIX_URL } from './config';

const instance = axios.create({
  baseURL: PREFIX_URL,
  timeout: 10000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error.response?.data || error.message);
  }
);

// 班级相关API
export const fetchClasses = () => instance.get('/classes');

// 学期相关API
export const fetchSemesters = () => {
  // 暂时返回固定学期列表，后续可改为从后端获取
  return Promise.resolve({
    data: [
      '2024-2025-第一学期',
      '2024-2025-第二学期',
      '2023-2024-第一学期',
      '2023-2024-第二学期'
    ]
  });
};

// 课表相关API
export const fetchClassTimetable = (classId: number, semester: string, week?: number) => {
  return instance.get(`/classes/${classId}/sheet`, {
    params: {
      semester,
      week
    }
  });
};

export default instance;
