<template>
  <div class="class-select-container">
    <h1 class="page-title">选择班级</h1>
    <button @click="showCreateDialog = true">创建班级</button>

    <!-- 创建班级对话框 -->
    <div v-if="showCreateDialog" class="modal-overlay">
      <div class="modal-content">
        <h2>创建新班级</h2>
        <form @submit.prevent="createclass">
          <div class="form-group">
            <label for="className">班级名称 <span class="required">*</span></label>
            <input
              id="className"
              v-model="formData.name"
              type="text"
              required
              placeholder="请输入班级名称"
            >
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                v-model="formData.create_sheet"
              >
              创建周表格
            </label>
          </div>

          <div v-if="formData.create_sheet" class="form-group">
            <label for="weeks">周数</label>
            <input
              id="weeks"
              v-model.number="formData.weeks"
              type="number"
              min="1"
              placeholder="请输入周数"
            >
          </div>

          <div class="form-actions">
            <button type="button" @click="showCreateDialog = false">取消</button>
            <button type="submit">创建</button>
          </div>
        </form>
      </div>
    </div>

    <div class="class-grid">
      <div
        v-for="classItem in classList"
        :key="classItem.id"
        class="class-card"
        @click="selectClass(classItem)"
      >
        <div class="class-name">{{ classItem.name }}</div>
        <button class="delete-btn" @click.stop="deleteClass(classItem.id)">删除</button>
        <div class="class-meta">
          <div class="meta-item">
            <span class="meta-label">创建时间:</span>
            <span class="meta-value">{{ formatDate(classItem.create_time) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">更新时间:</span>
            <span class="meta-value">{{ formatDate(classItem.update_time) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import { defineComponent, onMounted, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useScheduleStore } from '../stores/schedule';
import { createClass, fetchClasses, deleteClass } from '../utils/api'
import SheetSelect from './SheetSelect.vue';

interface ClassItem {
  id: number;
  name: string;
  create_id: string;
  create_time: string;
  update_time: string;
}

export default defineComponent({
  name: 'ClassSelectPage',
  setup() {
    const scheduleStore = useScheduleStore();
    const router = useRouter();
    const classList = ref<ClassItem[]>([]);
    const showCreateDialog = ref(false);
    const formData = reactive({
      name: '',
      create_sheet: false,
      weeks: 1
    });

    const fetchClassList = async () => {
      const classRes = await fetchClasses()
      classList.value = classRes.data?.list || []
      console.log('班级列表:', classList.value);
    };

    const createclass = async () => {
      try {
        await createClass({
          name: formData.name,
          create_sheet: formData.create_sheet,
          weeks: formData.create_sheet ? formData.weeks : undefined
        });
        showCreateDialog.value = false;
        formData.name = '';
        formData.create_sheet = false;
        formData.weeks = 1;
        await fetchClassList();
      } catch (error) {
        console.error('创建班级失败:', error);
      }
    };

    const deleteClassHandler = async (classId: number) => {
      if (confirm('确定要删除这个班级吗？')) {
        try {
          await deleteClass(classId);
          await fetchClassList();
        } catch (error) {
          console.error('删除班级失败:', error);
        }
      }
    };

    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const selectClass = (classItem: ClassItem) => {
      scheduleStore.setCurrentClass(classItem);
      router.push({
        name: 'SheetSelect',
        params: { class_id: classItem.id}
      });
    };

    onMounted(() => {
      fetchClassList();
    });

    return {
      classList,
      showCreateDialog,
      formData,
      createclass,
      deleteClass: deleteClassHandler,
      formatDate,
      selectClass
    };
  },
});
</script>

<style scoped>
.class-select-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

button {
  padding: 10px 20px;
  background-color: #3a7bd5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}

button:hover {
  background-color: #2c5fb3;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 25px;
}

.class-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 25px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  min-height: 120px;
}

.class-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.class-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #2c3e50;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 8px;
  font-size: 12px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #cc0000;
}

.class-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
}

.meta-label {
  color: #7f8c8d;
  font-size: 14px;
}

.meta-value {
  color: #34495e;
  font-size: 14px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group input[type="checkbox"] {
  margin-right: 10px;
}

.required {
  color: red;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.form-actions button {
  padding: 8px 16px;
}

.form-actions button[type="button"] {
  background-color: #e0e0e0;
  color: #333;
}

.form-actions button[type="button"]:hover {
  background-color: #d0d0d0;
}
@media (max-width: 768px) {
  .class-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .class-card {
    min-height: 100px;
  }
  .modal-content {
    width: 90%;
  }
  .modal-content h2 {
    font-size: 24px;
  }
  .modal-content .form-group label {
    font-size: 16px;
  }
  .modal-content .form-group input[type="text"],
  .modal-content .form-group input[type="number"] {
    font-size: 16px;
  }
  .modal-content .form-actions button {
    font-size: 16px;
  }
  .modal-content .form-actions button[type="button"] {
    font-size: 16px;
  }
  .modal-content .form-actions button[type="submit"] {
    font-size: 16px;
  }
  .modal-content .form-actions {
    gap: 20px;
  }
  .modal-content .form-actions button {
    padding: 10px 20px;
  }
  .modal-content .form-actions button[type="button"] {
    padding: 10px 20px;
  }
  .modal-content .form-actions button[type="submit"] {
    padding: 10px 20px;
  }

}
</style>
