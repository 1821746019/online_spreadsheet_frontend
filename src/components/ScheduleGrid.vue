<template>
  <div class="course-builder-container">
    <!-- 新建课程按钮和待拖动区 -->
    <div class="course-creator">
      <el-button type="primary" @click="showCreateDialog">新建课程</el-button>
      <div class="course-pool" ref="coursePool">
        <div v-for="course in draftCourses" :key="course.id"
             class="course-block draft" draggable="true"
             @dragstart="handleDragStart($event, course)"
             @dragend="handleDragEnd"@dblclick="showupdate(course)" v-if="!loading">
          <div class="course-content">
            <span class="course-title">{{ course.course }}</span>
             <span class="week-type" v-if="course.week_type === 'single'">单周</span>
        <span class="week-type"v-else-if="course.week_type === 'double'">双周</span>
    <span class="week-type" v-else-if="course.week_type === 'all'">全周</span>
            <span class="course-info">{{ course.teacher }} @ {{ course.room }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div class="week-selector">
      <el-select v-model="store.currentWeek" placeholder="第 1 周" @change="handleWeekChange">
        <el-option v-for="week in store.totalweek" :key="week" :label="`第 ${week} 周`" :value="week" />
      </el-select>
    </div>
    <div class="schedule-grid">
      <div class="header-row">
        <div class="time-header" style="background-color: #2d3748">时间</div>
        <div v-for="day in days" :key="day" class="day-header">
          {{ dayMap[day] }}
        </div>
      </div>
      <div class="time-grid">
        <div class="time-column">
          <div v-for="(time,index) in realtime" :key="time" class="time-slot">
            {{ time }}
            <span class="note">{{ notes[index] }}</span> <!-- 通过index匹配注释 -->
          </div>
        </div>

        <div v-for="day in days" :key="day" class="day-column" @dragover.prevent="handleDragOver"
          @drop="handleDrop($event, day)">
          <div v-for="time in realtime" :key="time" class="time-slot" :data-time="day + '-' + time"></div>

          <div v-for="course in getCoursesByDay(day)" :key="course.id" class="course-block"
            :style="getCourseStyle(course)" draggable="true" @dragstart="handleDragStart($event, course)"
            @dragend="handleDragEnd" :class="{ 'conflict': course.hasConflict }" @dblclick="handleDblClick(course)"v-if="!loading">
            <div class="course-content">
              <span class="course-title">{{ course.course }}</span>
              <span class="week-type" v-if="course.week_type === 'single'">单周</span>
        <span class="week-type"v-else-if="course.week_type === 'double'">双周</span>
    <span class="week-type" v-else-if="course.week_type === 'all'">全周</span>
              <span class="course-info">{{ course.teacher }} @ {{ course.room }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 编辑模态框 -->
  <teleport to="body">
    <div v-if="showEditDialog" class="edit-modal">
      <div class="modal-card">
        <h3 class="modal-title">编辑课程信息</h3>
        <div class="form-group">
          <label>课程名称</label>
          <el-input v-model="editingCourse.course" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
      <label>授课教师</label>
      <div class="form-group">
    <el-select
      v-model="editingCourse.teacher"
      clearable
      placeholder="请选择授课教师"
      class="modern-select"
      :loading="loadingTeachers"
    >
      <el-option
        v-for="teacher in teacherList"
        :key="teacher"
        :label="teacher"
        :value="teacher"
      />
    </el-select>
  </div>
    </div>
        <div class="form-group">
          <label>教室</label>
          <el-input v-model="editingCourse.room" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group"v-if="!drgamitemlog">
          <label>星期</label>
          <el-select v-model="editingCourse.col_index" class="modern-input">
            <el-option v-for="(day, index) in days" :key="day" :label="dayMap[day]" :value="index + 1" />
          </el-select>
        </div>
        <div class="form-group"v-if="!drgamitemlog">
          <label>时间段</label>
          <el-select v-model="editingCourse.row_index" class="modern-input">
            <el-option v-for="(time, index) in realtime" :key="time" :label="time" :value="index + 1" />
          </el-select>
        </div>
        <div class="form-group"v-if="drgamitemlog">
          <label>周次类型</label>
          <el-select v-model="editingCourse.week_type" class="modern-input">
            <el-option label="单周" value="single" />
            <el-option label="双周" value="double" />
            <el-option label="全周" value="all" />
          </el-select>
        </div>
        <div class="form-group"v-if="!drgamitemlog">
          <label>周次类型</label>
          <span class="modern-input"style='font-size: 14px;'>{{ { single: '单周', double: '双周', all: '全周' }[editingCourse.week_type] || editingCourse.week_type }}</span>
        </div>

        <div class="button-group">
          <button @click="showEditDialog = false,drgamitemlog=false,savedrag=false" class="cancel-btn">
            <span>取消</span>
          </button>
          <button @click="handleDelete" class="delete-btn" v-if="editingCourse&&!drgamitemlog">
            <span>删除表格中课程</span>
          </button>
          <button @click="saveCourse" class="save-btn"v-if="!savedrag">
            <!-- 保存表格中的课程和创建元素时保存 -->
            <span>保存</span>
          </button>
          <button @click="save_drag" class="save-btn"v-if="savedrag">
            <!-- 保存修改的拖放元素 -->
            <span>保存课程</span>
          </button>
          <button @click="delete_drag_item"class="delete-btn" v-if="drgamitemlog&&savedrag">
            <span>删除课程</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import {  onMounted, ref } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { fetchCellData,createDragItem,deleteDragItem,fetchDragItemlist,updateCellData, updateDragItem,getusers,getWeekcourse } from '../utils/api'
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
const store = useScheduleStore()
const loading = ref(false)
const emit = defineEmits(['courseMoved'])
// 新增状态
const draftCourses = ref([])
const coursePool = ref(null)
async function handleWeekChange(week) {
    loading.value = true
    store.stopPollingTimetable();
    try {
      // 确保weekToSheetMap已初始化
      if (!store.weekToSheetMap || Object.keys(store.weekToSheetMap).length === 0) {
        await store.fetchSheets(store.currentClass?.id)
      }

      store.currentWeek = week
      const sheetId = store.weekToSheetMap[week]

      if (sheetId === undefined) {
        throw new Error(`周数${week}没有对应的课表数据`)
      }

      await store.setCurrentSheet({ id: sheetId, week })
      await store.fetchTimetable(week)
      await getdraglist()
    } catch (error) {
      console.error('切换周数失败:', error)
      ElMessage.error(`切换周数失败: ${error.message}`)
    }finally {
      loading.value = false
      store.startPollingTimetable(week)
    }
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const realtime = [
  '08:30-09:55', // 第1-2节
  '10:15-11:40', // 第3-4节
  '11:45-12:25', // 第5节
  '14:00-15:25', // 第6-7节
  '15:45-17:10', // 第8-9节
  '17:15-17:55', // 第10节
  '19:00-20:20', // 第11-12节
  '20:30-21:50'  // 第13-14节
]
const notes = ['第1-2节', '第3-4节', '第5节','第6-7节','第8-9节','第10节','第11-12节','第13-14节'] // 注释数组
const dayMap = {
  Monday: '周一',
  Tuesday: '周二',
  Wednesday: '周三',
  Thursday: '周四',
  Friday: '周五',
  Saturday: '周六',
  Sunday: '周日'
}

function getCoursesByDay(day) {
  const dayIndex = days.indexOf(day) + 1;
  return store.timetable.filter(c => {
    const matchesWeek = c.week_type === 'all' ||
                      (c.week_type === 'single' && store.currentWeek % 2 === 1) ||
                      (c.week_type === 'double' && store.currentWeek % 2 === 0);
    return c.col_index === dayIndex && matchesWeek;
  });
}

const originalPositions = new Map()
const auth =useAuthStore()
function handleDragStart(e, course) {
  if (course.teacher !== auth.user.username) {
    e.preventDefault(); // 直接禁止拖动
    ElMessage.warning('您无权移动其他老师的课程');
    return;
  }
  store.ifdrag=false
  store.stopPollingTimetable();
  e.dataTransfer.setData('text/plain', course.id)
  e.dataTransfer.effectAllowed = 'move'
  e.target.classList.add('dragging')

  // 保存原位置信息
  originalPositions.set(course.id, {
    row_index: course.row_index,
    col_index: course.col_index,
    element: e.target
  })
}

function handleDragOver(e) {
  e.dataTransfer.dropEffect = 'move'
}

function handleDragEnd(e) {
  // const courseId = e.dataTransfer.getData('text/plain');
  e.target.classList.remove('dragging');
  store.ifdrag=true
}



async function handleDrop(e, day) {
  e.preventDefault();
  // 提取数据
  const courseId = e.dataTransfer.getData('text/plain');
  const targetColumn = e.currentTarget;
  const { top } = targetColumn.getBoundingClientRect();
  const mouseY = e.clientY - top;

  // 计算目标时间槽并验证范围
  const slotIndex = Math.floor(mouseY / 80) + 1;
  if (slotIndex < 1 || slotIndex > realtime.length) {
    // console.warn('超出时间范围');
    ElMessage.warning('超出时间范围，取消放置');
    return;
  }

  // 查找课程（优先从草稿中查找）
  const originalCourse = draftCourses.value.find(c => c.id === courseId) ||
                        store.timetable.find(c => c.id === courseId);
  if (!originalCourse) return;

  // 检查是否是相同位置
  const dayIndex = days.indexOf(day) + 1;
  if (originalCourse.col_index === dayIndex && originalCourse.row_index === slotIndex) {
    return;
  }

  // 检查冲突
  const targetDay = day;
  const targetTime = realtime[slotIndex - 1];
  const targetWeekType = originalCourse.week_type;

  const hasConflict = store.timetable.some(course => {
    if (course.id === courseId) return false;

    const courseDay = days[course.col_index - 1];
    const courseTime = realtime[course.row_index - 1];
    const courseWeekType = course.week_type;

    return courseDay === targetDay &&
           courseTime === targetTime &&
           (courseWeekType === 'all' || targetWeekType === 'all' || courseWeekType === targetWeekType);
  });

  if (hasConflict) {
    ElMessage.warning('目标位置有冲突，取消放置');
    return;
  }

  // 准备更新数据
  const updatedCourse = {
    ...originalCourse,
    col_index: dayIndex,
    row_index: slotIndex
  };

  // 获取原始位置信息
  const originalPosition = originalPositions.get(courseId);
  if (!originalPosition) return;

  try {
    const isFromDraft = draftCourses.value.some(c => c.id === courseId);

    if (isFromDraft) {
      // 从草稿区移动到正式课程
      await store.updateCourse(updatedCourse, false);
      draftCourses.value = draftCourses.value.filter(c => c.id !== courseId);
    } else {
     const updateOperations = [];

// 总是添加第一个操作
const firstOp = store.updateCourse(updatedCourse, false);
updateOperations.push(firstOp);

// 只有第一个操作成功时才添加第二个
if (!originalCourse.hasConflict) {
  const secondOp = firstOp.then(() =>
    updateCellData(
      store.currentClass.id || 0,
      store.currentSheet.id || 0,
      {
        Row: originalCourse.row_index,
        Col: originalCourse.col_index
      }
    )
  );
  updateOperations.push(secondOp);
}

  await Promise.all(updateOperations);
    }
  } catch (error) {
    console.error('拖放操作失败:', error);
    ElMessage.error('操作失败，已回退到原位置');
    console.error('回退到原位置:', courseId);
    store.timetable = store.timetable.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          col_index: originalPosition.col_index,
          row_index: originalPosition.row_index
        }
      }
      return course;
    });
    
if(error.msg==='目标单元格已有拖拽元素'){
  return
}
    await updateCellData(
      store.currentClass.id || 0,
      store.currentSheet.id || 0,
      {
        Row: updatedCourse.row_index,
        Col: updatedCourse.col_index
      }
    )
}finally{
  await store.startPollingTimetable(store.currentWeek);
}
}
function getCourseStyle(course) {
  if(course.teacher !== auth.user.username){
    return {
      top: `${(course.row_index - 1) * 80}px`,
      height: '60px', // 默认高度
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%)', // 禁止拖动时的背景色
      border: '1px dashed #e9ecef'
    }
  }
  return {
    top: `${(course.row_index - 1) * 80}px`,
    height: '60px' // 默认高度
  }
}

// 编辑相关状态
const editingCourse = ref(null)
const showEditDialog = ref(false)
const drgamitemlog=ref(false)
const savedrag=ref(false)
function handleDblClick(course) {
  if (course.teacher !== auth.user.username) {
    ElMessage.warning('您无权编辑其他老师的课程');
    return;
  }
  console.log('hand',course)
  editingCourse.value = {
    // week_type: 'all',
    ...(course || {}),
    id: course?.id //因为id类型问题现在获取的课表无法拖动，创建元素，更新元素等api没有导入
  }
  // console.log('edi',editingCourse.value)
  showEditDialog.value = true
}
function showupdate(course){
  drgamitemlog.value=true
  savedrag.value=true
  handleDblClick(course)
}
async function save_drag(){
  // store.
  try{
  await updateDragItem(editingCourse.value.id, {
            class_room: editingCourse.value.room,
            content: editingCourse.value.course,
            teacher: editingCourse.value.teacher,
            selected_class_ids: [store.currentClass.id],
            week_type: editingCourse.value.week_type,
          })
   console.log('edi',editingCourse.value)

    showEditDialog.value=false
    drgamitemlog.value=false
    savedrag.value=false
    draftCourses.value = draftCourses.value.filter(
    course => course.id !== editingCourse.value.id
  )
    await getdraglist()
  }catch(error){
    console.log(error)
    ElMessage.error(`${error.msg}` );
  }
}
// 显示创建对话框
function showCreateDialog() {
  drgamitemlog.value=true
  editingCourse.value = {
    id: Math.random(100).toString(),
    course: '新课程',
    teacher: auth.user.username,
    room: '教室',
    week_type: 'all'
  }
  showEditDialog.value = true
}
async function delete_drag_item() {
  if (editingCourse.value && confirm('确认删除该拖动课程？')) {
    try{
    await deleteDragItem(editingCourse.value.id)
    ElMessage.success('删除拖动元素成功')
    draftCourses.value = draftCourses.value.filter(
    course => course.id !== editingCourse.value.id
  )
  showEditDialog.value=false
    drgamitemlog.value=false
    savedrag.value=false
    await getdraglist()
  }catch(e){
      ElMessage.warning('必须解除该课程在所有表格的关联')
  }
  }
}
async function saveCourse() {
  if (!editingCourse.value) return;
  console.log('edi',editingCourse.value)
  // 缓存当前班级ID，减少重复访问响应式属性
  const currentClassId = store.currentClass?.id || 0;

  // 使用对象展开语法避免污染原始数据
  const courseToSave = {
    ...editingCourse.value,
    classId: currentClassId
  };

  try {
    // 使用Set实现O(1)复杂度查找，替代数组some方法
    const existingIds = new Set([
      ...store.timetable.map(c => c.id),
      ...draftCourses.value.map(c => c.id)
    ]);
    console.log('existingIds',existingIds)
    if (!existingIds.has(courseToSave.id)) {
      // 合并接口参数对象
      const response = await createDragItem({
        content: courseToSave.course,
        teacher: courseToSave.teacher,
        class_room: courseToSave.room,
        week_type: courseToSave.week_type,
        selected_class_ids: [currentClassId], // 使用缓存值
      });
      editingCourse.value.id=response.data.id.toString()
      // 批量更新对象属性
      const newCourse = {
        ...courseToSave,
        id: response.data.id.toString()
      };

      // 使用不可变数据操作减少响应式系统开销
      draftCourses.value = [...draftCourses.value, newCourse];
      ElMessage.success('成功创建拖动元素')
    } else {
      // 使用细粒度状态更新
      // const courseExists = store.timetable.find(c => c.id === courseToSave.id);
      // if (courseExists) {
      //   // 更新已有课程
      const originalCourse = store.timetable.find(course => course.id === courseToSave.id);
const hasConflict = store.timetable.some(course => {
        if (course.id === courseToSave.id) return false;

        const courseDay = days[course.col_index - 1];
        const courseTime = realtime[course.row_index - 1];
        const courseWeekType = course.week_type;

        return courseDay === days[courseToSave.col_index - 1] &&
               courseTime === realtime[courseToSave.row_index - 1] &&
               (courseWeekType === 'all' || courseToSave.week_type === 'all' || courseWeekType === courseToSave.week_type);
      });

      if (hasConflict) {
        ElMessage.warning('目标位置有冲突，取消保存');
        return;
      }

  if (originalCourse) {
    console.log('originalCourse',originalCourse)
    console.log('courseToSave',courseToSave)
    // 检查 col_index 或 row_index 是否有一个不相同
    if (originalCourse.col_index !== courseToSave.col_index ||
        originalCourse.row_index !== courseToSave.row_index) {
      const updateOperations = [];

// 总是添加第一个操作
const firstOp = store.updateCourse(courseToSave, false);
updateOperations.push(firstOp);

// 只有第一个操作成功时才添加第二个
if (!originalCourse.hasConflict) {
  const secondOp = firstOp.then(() =>
    updateCellData(
      store.currentClass.id || 0,
      store.currentSheet.id || 0,
      {
        Row: originalCourse.row_index,
        Col: originalCourse.col_index
      }
    )
  );
  updateOperations.push(secondOp);
}

try {
  await Promise.all(updateOperations);
} catch (error) {
  console.error('更新操作失败:', error);
  console.error('回退到原位置:', originalCourse.id);
    store.timetable = store.timetable.map(course => {
      if (course.id === originalCourse.id) {
        return {
          ...course,
          col_index: originalCourse.col_index,
          row_index: originalCourse.row_index
        }
      }
    return course;
    }
    )
    await updateCellData(
      store.currentClass.id || 0,
      store.currentSheet.id || 0,
      {
        Row: courseToSave.row_index,
        Col: courseToSave.col_index
      }
    )
  throw error;
}
        }else{
          store.updateCourse(courseToSave,false,false)
    }
  }
    }

    // 延迟界面更新到异步操作完成后
    showEditDialog.value = false;
  } catch (error) {
    console.error('保存课程失败:', error);
  }finally {
    // 清理编辑状态
    editingCourse.value = false;
    savedrag.value = false;
    drgamitemlog.value = false;
    showEditDialog.value = false;
  }
}

const handleDelete = async() => {
  if (editingCourse.value && confirm('确认删除该课程？')) {
    console.log('deledi',editingCourse.value)
    store.removeCourse(editingCourse.value.id)
    // draftCourses.value = draftCourses.value.filter(c => c.id !== editingCourse.value.id)
    showEditDialog.value = false
    ElMessage.success('删除成功');
    draftCourses.value=[]
    await getdraglist()
  }
}
async function getdraglist() {
  loading.value = true;

  try {
    const classId = store.currentClass.id;
    if (!classId) return; // 添加空值检查

    const response = await fetchDragItemlist(classId);
    const rawCourses = response.data || []; // 添加空数组保护

    // 数据转换
    const dragCourses = rawCourses.map(item => ({
      id: item.id.toString(),
      course: item.content,
      teacher: item.teacher,
      room: item.class_room,
      week_type: item.week_type,
    }));

    // 过滤出不在课表和草稿中的课程
    const differentCourses = dragCourses.filter(dragCourse =>
      !store.timetable.some(c => c.id === dragCourse.id) &&
      !draftCourses.value.some(c => c.id === dragCourse.id)
    );
    console.log('不同的课程:', differentCourses);
    if (differentCourses.length > 0) { // 明确检查数组长度
      draftCourses.value = [...draftCourses.value, ...differentCourses]; // 使用不可变更新
    }
// 清理草稿课程列表，移除已存在于课表中的课程
draftCourses.value = draftCourses.value.filter(draftCourse =>
  !store.timetable.some(timetableCourse => timetableCourse.id === draftCourse.id)
);
//过滤掉因为week_type不同导致在其他周的课程
        const sheetId = store.weekToSheetMap[store.currentWeek%2===0?1:2] || store.currentSheet.value?.id;
    const other_response = await fetchCellData(store.currentClass, sheetId);
        // console.log('cell', response.data);

        const cellData = other_response.data.filter((item) => item.item_id !== null);
        // timetable.value = [];
        // courseMap.value.clear();
        const newCourses = cellData.map(cell => ({
          classId: store.currentClass,
          col_index: cell.col_index,
          course: cell.content,
          hasConflict: false,
          id: cell.item_id.toString(),
          room: cell.class_room,
          row_index: cell.row_index,
          teacher: cell.teacher,
          week_type: cell.week_type || 'all',
        }));
        //过滤出与newCourses中不同的课程
        draftCourses.value = draftCourses.value.filter(draftCourse =>
          !newCourses.some(newCourse => newCourse.id === draftCourse.id)
        );
//过滤得到自己的课程
    draftCourses.value = draftCourses.value.filter(course => course.teacher === auth.user.username);

    return differentCourses; // 返回结果以便后续使用
  } catch (error) {
    console.error('获取拖动列表失败:', error);
    ElMessage.error('获取课程列表失败'); // 添加用户反馈
    throw error;
  } finally {
    loading.value = false;
  }
}
const teacherList = ref([]);
const loadingTeachers = ref(false);

// 从API获取教师列表
async function fetchTeachers() {
  loadingTeachers.value = true;
  try {
    const response = await getusers();
    console.log('教师列表:', response.data);
    teacherList.value = response.data; // 直接使用API返回的数组
  } catch (error) {
    console.error('获取教师列表失败:', error);
    // 可以设置默认值或显示错误信息
    teacherList.value = [];
  } finally {
    loadingTeachers.value = false;
  }
}

onMounted(async()=>{
  // console.log(getusers(),'users')
  if (store.currentClass?.id) {
    await store.fetchSheets(store.currentClass.id)
  }
  // console.log(getWeekcourse({week:3}),'getWeekcourse')
  // await fetchTeachers()
  teacherList.value.push(auth.user.username);
  await getdraglist()

})
</script>

<style scoped>
.week-selector {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #718096;
  font-size: 16px;
}
.schedule-grid {
  padding: 20px;
  max-width: 1500px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.header-row {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
  background: #f8fafc;
}

.time-header,
.day-header {
  background: #2d3748;
  color: white;
  padding: 15px 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95em;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.time-header {
  background: #1a202c;
}

.time-grid {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 1px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.time-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
  white-space: nowrap;
  font-size: 0.8em;
  border-right: 1px solid #e2e8f0;
}
.note {
  white-space: normal; /* 允许注释换行 */
  word-break: break-word; /* 强制长单词/中文换行 */
  display: block; /* 让注释独占一行 */
  margin-top: 4px; /* 与时间增加间距 */
}
.time-slot {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 0.85em;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}

.day-column {
  position: relative;
  min-height: 800px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  background-image: linear-gradient(to bottom, #edf2f7 1px, transparent 1px);
  background-size: 100% 80px;
}

.course-block {
  position: absolute;
  top: calc(var(--slot-index) * 80px);
  left: 4px;
  right: 4px;
  height: calc(var(--slot-duration) * 80px);
  min-height: 60px;
  overflow: hidden;
  background: linear-gradient(135deg, #ebf4ff 0%, #c3dafe 100%);
  border: 2px solid #90cdf4;
  border-radius: 8px;
  padding: 10px;
  cursor: grab;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  user-select: none;
}

.course-block.dragging {
  opacity: 0.8;
  transform: scale(0.98);
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.course-block:active {
  cursor: grabbing;
}

.course-block:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: #63b3ed;
}

.course-block.conflict {
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border-color: #fc8181;
  z-index: 1;
  animation: pulse 1.5s infinite;
}

.course-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.course-title {
  font-weight: 600;
  font-size: 0.95em;
  line-height: 1.3;
  min-height: 1.5em;
  margin-bottom: 4px;
  color: #2d3748;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

}
.week-type {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 0.25em;
  color: #2d3748;
  border-radius: 0.25em;
}
.course-info {
  font-size: 0.75em;
  color: #4a5568;
  line-height: 1.3;
  min-height: 1.5em;
  flex-grow: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.user-indicator {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
  0% {
    transform: scale(0.98);
    box-shadow: 0 0 0 0 rgba(252, 129, 129, 0.4);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(252, 129, 129, 0);
  }

  100% {
    transform: scale(0.98);
    box-shadow: 0 0 0 0 rgba(252, 129, 129, 0);
  }
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 40px;
  padding-bottom: 40px;
  overflow-y: hidden;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 500px;
  max-height: calc(100vh - 100px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  min-width: 400px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-title {
  color: #2d3748;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  position: relative;
  padding-bottom: 12px;
}

.modal-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #4299e1, #48bb78);
  border-radius: 3px;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  color: #4a5568;
  font-size: 0.95rem;
  font-weight: 600;
}

.modern-input {
  /* width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  background-color: #f8fafc; */
}

.modern-input:focus {
  background-color: white;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
  border-color: #4299e1;
}

.modern-input:hover {
  border-color: #cbd5e0;
}

.button-group {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  position: sticky;
  bottom: 0;
  background: white;
  padding-top: 16px;
  padding-bottom: 8px;
  z-index: 1;
}

.save-btn,
.cancel-btn,
.delete-btn {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.save-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(72, 187, 120, 0.3);
}

.cancel-btn {
  background: #edf2f7;
  color: #4a5568;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.delete-btn {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
  margin-right: auto;
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(245, 101, 101, 0.3);
}

@media (max-width: 1600px) {
  .schedule-grid {
    max-width: 95%;
    overflow-x: auto;
  }

  .header-row,
  .time-grid {
    grid-template-columns: 100px repeat(7, minmax(120px, 1fr));
  }

  .day-header {
    padding: 12px 8px;
    font-size: 0.9em;
  }

  .time-slot {
    font-size: 0.85em;
  }
}

@media (max-width: 768px) {
  .modal-card {
    width: 90%;
    padding: 1.5rem;
    min-width: 100px;
  }

  .button-group {
    flex-wrap: wrap;
  }

  .save-btn,
  .cancel-btn,
  .delete-btn {
    flex: 1;
    justify-content: center;
  }
}

.course-builder-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
}

.course-creator {
  margin-bottom: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.course-pool {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 20px;
  min-height: 100px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
  align-items: start;
}

.course-block.draft {
  background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
  border-color: #68d391;
  cursor: grab;
  height: 80px;
  margin: 0;
  width: 80px;
  position: static;
  width: 100%;
  box-sizing: border-box;
}

.course-block.draft:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .course-pool {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .course-pool {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .course-block.draft {
    height: 70px;
    padding: 8px;
  }

  .course-title {
    font-size: 0.85em;
  }

  .course-info {
    font-size: 0.75em;
  }
  .week-type{
    font-size: 0.15em;
  }
}

@media (max-width: 480px) {
  .course-pool {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }
}
</style>
