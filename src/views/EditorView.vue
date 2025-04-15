<template>
  <div class="editor-view">
    <div class="header-selectors">
    <h2>{{ selectedClass.name }}{{  }}</h2>
    </div>

    <CourseDataform></CourseDataform>
    <hr>
    <!-- <div class="toolbar">
      <button @click="addNewCourse" class="feat-btn">添加课程</button>
      <div class="current-user">
        当前用户: {{ auth.user?.username }}
        <span class="color-indicator" :style="{ backgroundColor: auth.user?.color || '#cccccc' }"></span>
      </div>
    </div> -->
    <ScheduleGrid @courseMoved="handleCourseMoved" />
  </div>
</template>

<script setup name="EditorView">
import { ref, onMounted } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import ScheduleGrid from '../components/ScheduleGrid.vue'
import { emitOperation } from '../utils/socket'
import { useAuthStore } from '../stores/auth'
import CourseDataform from '../components/CourseDataform.vue'
import { useRoute } from 'vue-router'
const auth = useAuthStore()
const store = useScheduleStore()
const selectedClass = store.currentClass
// const selectedSemester = ref('2024-2025-第一学期')
// 定义班级信息接口
const router = useRoute()
const classInfo = {
  id: store.currentClass?.id || 0
}


// 预定义的学期列表
// const semesters = ref([
//   '2024-2025-第一学期',
//   '2024-2025-第二学期'
// ])


// function handleClassChange(classInfo) {
//   store.setCurrentClass(classInfo)
// }

// function handleSemesterChange(semester) {
//   store.setCurrentSemester(semester)
// }

function handleCourseMoved(course) {
  emitOperation({
    type: 'update',
    data: course,
    version: Date.now(),
    timestamp: Date.now(),
    userId: auth.user?.username || 'unknown'
  })
}

function addNewCourse() {
  const newCourse = {
    id: typeof self !== 'undefined' && self.crypto && self.crypto.randomUUID
        ? self.crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0,
                  v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          }),
    day: 'Monday',
    start: '08:30',
    end: '9:55',
    course: '新课程',
    teacher: '新老师',
    room: '未分配',
    week: store.currentWeek,
    lastUpdatedBy: auth.user?.username || 'unknown',
    classId: store.currentClass?.id || 0,
    // semester: store.currentSemester || '2024-2025-第一学期'
  }
  store.timetable.push(newCourse)
  emitOperation({
    type: 'insert',
    data: newCourse,
    version: Date.now(),
    timestamp: Date.now(),
    userId: auth.user?.username || 'unknown'
  })
}








//课程块
const courses = ref([]);
const selectedIndex = ref(-1);

const addCourse = () => {
  courses.value.push({
    id: Date.now(),
    name: `课程 ${courses.value.length + 1}`
  });
};

const deleteCourse = (index) => {
  courses.value.splice(index, 1);
  if (selectedIndex.value === index) {
    selectedIndex.value = -1;
  } else if (selectedIndex.value > index) {
    selectedIndex.value--;
  }
};

const selectCourse = (index) => {
  selectedIndex.value = selectedIndex.value === index ? -1 : index;
};
</script>

<style scoped>
.editor-view{
  flex: 1;
  padding: 1rem;
  max-width: 1500px;
  margin: 0 auto;
  width: 100%;
}

.header-selectors {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.selector {
  flex: 1;
  max-width: 300px;
}
.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
}

.color-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-left: 8px;
}

.collaborators {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.collaborator {
  margin: 8px 0;
  display: flex;
  align-items: center;
}
.feat-btn {
  background-color: #2c3e50;
  color: white;
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}


</style>
