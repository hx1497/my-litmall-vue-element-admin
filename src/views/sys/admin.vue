<template>
  <div class="app-container">
    <!-- 查询和其他操作 -->
    <div class="filter-container">
      <el-input v-model="listQuery.username" clearable class="filter-item" style="width: 200px;" placeholder="请输入管理员名称" />
      <el-button v-permission="['GET /admin/admin/list']" class="filter-item left" type="primary" icon="el-icon-search" @click="handleSearch">查找</el-button>
      <el-button v-permission="['POST /admin/admin/create']" class="filter-item" type="primary" icon="el-icon-edit" @click="handleEdit">添加</el-button>
      <el-button v-loading="downloading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">导出</el-button>
    </div>

    <!-- 查询结果 -->
    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row>
      <el-table-column align="center" label="管理员ID" prop="id" sortable />
      <el-table-column align="center" label="管理员名称" prop="username" />
      <el-table-column align="center" label="管理员头像" prop="avatar">
        <template slot-scope="scope">
          <img v-if="scope.row.avatar" :src="scope.row.avatar" width="40">
        </template>
      </el-table-column>
      <el-table-column align="center" label="管理员角色" prop="roleIds">
        <template slot-scope="scope">
          <el-tag v-for="roleId in scope.row.roleIds" :key="roleId" type="primary" style="margin-right: 20px;"> {{ formatRole(roleId) }} </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button v-permission="['POST /admin/admin/update']" type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button v-permission="['POST /admin/admin/delete']" type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <!-- 添加或修改对话框 -->
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="isEdit">
      <el-form
        ref="editForm"
        :rules="rules"
        :model="editForm"
        label-width="100px"
        label-position="left"
        style="width: 400px; margin-left: 50px"
      >
        <el-form-item label="管理员名称" prop="username">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="管理员密码" prop="password">
          <el-input v-model="editForm.password" type="password" auto-complete="off" />
        </el-form-item>
        <el-form-item label="管理员头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            :action="uploadPath"
            :headers="headers"
            :show-file-list="false"
            :on-success="uploadAvatarUrl"
            accept=".jpg,.jpeg,.png,.gif"
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon" />
          </el-upload>
        </el-form-item>
        <el-form-item label="管理员角色" prop="rolesId">
          <el-select v-model="editForm.roleIds" multiple placeholder="请选择">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isEdit=false">取消</el-button>
        <el-button v-if="dialogStatus == 'create' " type="primary" @click="handleEditDone">确认</el-button>
        <el-button v-else type="primary" @click="updateData">确认</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import { getToken } from '@/utils/auth'
import { listAdmin, createAdmin, updateAdmin, deleteAdmin } from '@/api/admin'
import { roleOptions } from '@/api/role'
import { uploadPath } from '@/api/storage'
export default {
  name: 'Admin',
  components: { Pagination },
  data() {
    return {
      uploadPath,
      total: 0,
      roleOptions: null,
      listQuery: {
        username: undefined,
        page: 1,
        limit: 20,
        sort: 'add_time',
        order: 'desc'
      },
      downloading: false,
      listLoading: true,
      list: null,
      isEdit: false,
      editForm: {
        id: undefined,
        username: undefined,
        password: undefined,
        avatar: undefined,
        roleIds: []
      },
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '创建'
      },
      rules: {
        username: [{ required: true, message: '管理员名称不能为空', trigger: 'blur' }],
        password: [
          { required: true, message: '管理员密码不能为空', trigger: 'blur' },
          { min: 6, message: '密码不能少于6位', trigger: 'change' }
        ]
      },
      roles: []
    }
  },
  computed: {
    headers() {
      return {
        'X-Litemall-Admin-Token': getToken()
      }
    }
  },
  created() {
    this.getList()
    roleOptions()
      .then(res => {
        // console.log('roleOptions',res)
        this.roleOptions = res.data.data.list
        console.log(this.roleOptions)
      })
  },
  methods: {
    getList() {
      this.listLoading = true
      listAdmin(this.listQuery)
        .then(res => {
          console.log(res)
          this.list = res.data.data.list
          this.total = res.data.data.total
          this.listLoading = false
        }).catch(() => {
          this.list = []
          this.total = 0
          this.listLoading = false
        })
    },
    handleSearch() {
      this.listQuery.page = 1
      this.getList()
    },
    resetForm() {
      this.editForm = {
        id: undefined,
        username: undefined,
        password: undefined,
        avatar: undefined,
        roleIds: []
      }
    },
    handleEdit() {
      this.resetForm()
      this.dialogStatus = 'create'
      this.isEdit = true
      this.$nextTick(() => {
        this.$refs['editForm'].clearValidate()
      })
    },
    handleDownload() {
      this.downloading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['管理员ID', '管理员名称', '管理员头像']
        const filterVal = ['id', 'username', 'avatar']
        excel.export_json_to_excel2(
          tHeader,
          this.list,
          filterVal,
          '管理员信息'
        )
        this.downloading = false
      })
    },
    formatRole(roleId) {
      for (let i = 0; i < this.roleOptions.length; i++) {
        if (roleId === this.roleOptions[i].value) {
          return this.roleOptions[i].label
        }
      }
    },
    handleUpdate(row) {
      this.dialogStatus = 'update'
      this.isEdit = true
      this.editForm = Object.assign({}, row)
      this.$nextTick(() => {
        this.$refs['editForm'].clearValidate()
      })
    },
    handleDelete(row) {
      deleteAdmin(row)
        .then(res => {
          this.getList()
          this.$notify.success({
            title: '成功',
            message: '删除管理员成功'
          })
        })
    },
    uploadAvatarUrl(res) {
      this.editForm.avatar = res.data.url
    },
    handleEditDone() {
      this.$refs['editForm'].validate(valid => {
        if (valid) {
          createAdmin(this.editForm)
            .then(res => {
              this.list.unshift(res.data.data)
              this.isEdit = false
              this.$notify.success({
                title: '成功',
                message: '管理员添加成功'
              })
            }).catch(res => {
              this.$notify.error({
                title: '失败',
                message: res.data.errmsg
              })
            })
        }
      })
    },
    updateData() {
      this.$refs['editForm'].validate(valid => {
        if (valid) {
          updateAdmin(this.editForm)
            .then(() => {
              for (const v of this.list) {
                const index = this.list.indexOf(v)
                this.list.splice(index, 1, this.editForm)
                break
              }
              this.isEdit = false
              this.$notify.success({
                title: '成功',
                message: '更新管理员成功'
              })
            })
            .catch(res => {
              this.$notify.error({
                title: '失败',
                message: res.data.errmsg
              })
            })
        }
      })
    }

  }
}
</script>
<style>
.left {
    margin-left: 4px
}
.avatar-uploader .el-upload {
  width: 145px;
  height: 145px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #20a0ff;
}
.avatar-uploader-icon {
  width: 120px;
  height: 120px;
  font-size: 28px;
  line-height: 120px;
  color: #8c939d;
  text-align: center;
}
.avatar {
  width: 145px;
  height: 145px;
  display: block;
}
</style>
