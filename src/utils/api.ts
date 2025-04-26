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
export const fetchClassById = (classId: number) => instance.get(`/classes/${classId}`);
interface CreateClassParams {
  name: string;
  create_sheet?: boolean;
  weeks?: number;
}
export const createClass = (params: CreateClassParams) => instance.post('/classes', params);
export const updateClass = (classId: number, classData: any) => instance.put(`/classes/${classId}`, classData);
export const deleteClass = (classId: number) => instance.delete(`/classes/${classId}`);
// // 学期相关API
// export const fetchSemesters = () => {
//   // 暂时返回固定学期列表，后续可改为从后端获取
//   return Promise.resolve({
//     data: [
//       '2024-2025-第一学期',
//       '2024-2025-第二学期',
//       '2023-2024-第一学期',
//       '2023-2024-第二学期'
//     ]
//   });
// };

// // 课表相关API
// export const fetchClassTimetable = (classId: number, semester: string, week?: number) => {
//   return instance.get(`/classes/${classId}/sheet`, {
//     params: {
//       semester,
//       week
//     }
//   });
// };

//工作表相关API
export interface create_sheet_response {
  /**
   * 列数
   */
  col: number;
  /**
   * 工作表名称
   */
  name: string;
  /**
   * 行数
   */
  row: number;
  /**
   * 周数
   */
  week: number;
  [property: string]: any;
}

export const create_sheet= (classId: number,sheet:create_sheet_response) =>instance.post(`/classes/${classId}/sheet`,sheet);
export interface sheetlist_request {
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页记录数
   */
  page_size?: number;
  [property: string]: any;
}
export const fetch_sheetlist = (classId: number, params: sheetlist_request) => instance.get(`/classes/${classId}/sheet`, { params });
export const fetch_sheet = (classId: number, sheetId: number) => instance.get(`/classes/${classId}/sheet/${sheetId}`);
export const update_sheet = (classId: number, sheetId: number) => instance.put(`/classes/${classId}/sheet/${sheetId}`);
export const delete_sheet = (classId: number, sheetId: number) => instance.delete(`/classes/${classId}/sheet/${sheetId}`);


//拖动元素相关API
/**
 * CreateDragItemRequest
 */
export interface CreateDragItemRequest {
  /**
   * 教室
   */
  classroom: string;
  /**
   * 拖放元素内容
   */
  content: string;
  /**
   * 可使用的班级ID列表
   */
  selected_class_ids: number[];
  /**
   * 周类型
   */
  week_type: string;
  [property: string]: any;
}
export const createDragItem = (params: CreateDragItemRequest) => instance.post('/drag-item', params);
export const updateDragItem = (drag_item_id: number,params: CreateDragItemRequest) => instance.put(`/drag-item/${drag_item_id}`, params);
export const deleteDragItem = (drag_item_id: number) => instance.delete(`/drag-item/${drag_item_id}`);
export const fetchDragItem = (drag_item_id: number) => instance.get(`/drag-item/${drag_item_id}`);
export const fetchDragItemlist = (class_id: number) => instance.get(`${class_id}/drag-item`);

/**
 * MoveDragItemRequest
 */
export interface move {
  /**
   * 目标列索引（从1开始）
   */
  target_col: number;
  /**
   * 目标行索引（从1开始）
   */
  target_row: number;
  [property: string]: any;
}
export const moveDragItem = (drag_item_id: number,class_id: number, sheet_id: number,move: move) => instance.put(`/classes/${class_id}/sheet/${sheet_id}/drag-item/${drag_item_id}/move`, move);

//获取单元格数据
export interface Cell {
  col_index?: number;
  create_time?: Date;
  id?: number;
  item_id?: number | null;
  row_index?: number;
  sheet_id?: number;
  update_time?: Date;
  [property: string]: any;
}
export const fetchCellData = (classId: number, sheetId: number) => {
  return instance.get(`/classes/${classId}/sheet/${sheetId}/cell`);
};
export interface putcell{
  Row:number;
  Col:number;
}
export const updateCellData=(classId: number, sheetId: number,putcell:putcell) => {
  return instance.put(`/classes/${classId}/sheet/${sheetId}/cell`,putcell);
};


export default instance;
