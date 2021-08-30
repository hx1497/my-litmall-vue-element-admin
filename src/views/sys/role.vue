<template>
  <div class="app-container">
    <!-- 查询与添加 -->
    <div class="filter-container">
      <el-input v-model="listQuery.name" class="filter-item" style="width: 200px" placeholder="请输入角色名称" />
      <el-button v-permission="['GET /admin/role/list']" type="primary" class="filter-item left" icon="el-icon-search" @click="handleFilter">查找</el-button>
      <el-button v-permission="['POST /admin/role/create']" type="primary" class="filter-item left" icon="el-icon-edit" @click="handleCreate">添加</el-button>
    </div>
    <!-- 查询结果 -->
    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row>
      <el-table-column align="center" label="角色名称" prop="name" sortable />
      <el-table-column align="center" label="说明" prop="desc" />
      <el-table-column align="center" label="操作" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button v-permission="['POST /admin/role/update']" type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button v-permission="['POST /admin/role/delete']" type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
          <el-button v-permission="['GET /admin/role/permissions']" type="primary" size="mini" @click="handleAuthorize(scope.row)">授权</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <!-- 添加或编辑对话框 -->
    <el-dialog :visible.sync="isEdit" :title="textMap[dialogStatus]">
      <el-form
        ref="dataForm"
        :model="dataForm"
        :rules="rules"
        status-icon
        label-width="100px"
        label-position="left"
        style="width: 400px; margin-left: 50px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="dataForm.name" />
        </el-form-item>
        <el-form-item label="说明" prop="desc">
          <el-input v-model="dataForm.desc" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isEdit=false">取消</el-button>
        <el-button v-if="dialogStatus == 'create' " type="primary" @click="createData">确定</el-button>
        <el-button v-else type="primary" @click="updateData">确定</el-button>
      </span>
    </el-dialog>

    <!-- 授权对话框
         使用 default-checked-keys(默认选中节点) 和default-expanded-keys(默认展开节点) 时,
         需要设置node-key，其值为节点数据中的一个字段名，该字段在整棵树中是唯一的。
    -->
    <el-dialog title="权限配置" :visible.sync="isAuthorize">
      <el-tree
        ref="tree"
        :data="systemPermissions"
        :default-checked-keys="assignedPermissions"
        node-key="id"
        show-checkbox
        highlight-current
      >
        <span slot-scope="{ node, data }" class="custom-tree-node">
          <span>{{ node.label }}</span>
          <el-tag v-if="data.api" type="success" size="mini"> {{ data.api }} </el-tag>
        </span>
      </el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isAuthorize = false">取消</el-button>
        <el-button type="primary" @click="authorized">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import { listRole, createRole, updateRole, deleteRole, getPermission, updatePermission } from '@/api/role'
import Pagination from '@/components/Pagination'

export default {
  name: 'Role',
  components: { Pagination },
  data() {
    return {
      total: 0,
      listQuery: {
        page: 1,
        limit: 20,
        name: undefined,
        sort: 'add_time',
        order: 'desc'
      },
      isEdit: false,
      list: [],
      listLoading: false,
      dialogStatus: '',
      textMap: {
        'create': '创建',
        'update': '编辑'
      },
      rules: {
        name: [
          { required: true, message: '角色名称不能为空', trigger: 'blur' }
        ]
      },
      dataForm: {
        id: undefined,
        name: undefined,
        desc: undefined
      },
      isAuthorize: false,
      systemPermissions: null,
      assignedPermissions: null,
      permissionForm: {
        roleId: undefined,
        permissions: []
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      listRole(this.listQuery)
        .then(res => {
          this.list = res.data.data.list
          this.total = res.data.data.total
          this.listLoading = false
        })
        .catch(() => {
          this.list = [],
          this.total = 0,
          this.listLoading = false
        })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    resetForm() {
      this.dataForm = {
        id: undefined,
        name: undefined,
        desc: undefined
      }
    },
    handleCreate() {
      this.resetForm()
      this.dialogStatus = 'create'
      this.isEdit = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          createRole(this.dataForm)
            .then(res => {
              console.log('formposted', res)
              this.list.unshift(res.data.data)
              this.isEdit = false
              this.$notify.success({
                title: '成功',
                message: '添加角色成功!'
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
    },
    handleUpdate(row) {
      this.dataForm = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.isEdit = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          updateRole(this.dataForm)
            .then(() => {
            /* 根据id定位dataForm,将更新后的dataForm数据替换掉list中原本的dataForm数据*/
              for (const v of this.list) {
                if (v.id === this.dataForm.id) {
                  const index = this.list.indexOf(v)
                  this.list.splice(index, 1, this.dataForm)
                  break
                }
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
    },
    handleDelete(row) {
      deleteRole(row)
        .then(() => {
          this.getList()
          this.$notify.success({
            title: '成功',
            message: '成功删除管理员'
          })
        })
        .catch(res => {
          this.$notify.error({
            title: '失败',
            message: res.data.errmsg
          })
        })
    },
    handleAuthorize(row) {
      this.isAuthorize = true
      this.permissionForm.roleId = row.id
      getPermission({ roleId: row.id })
        .then(res => {
          this.systemPermissions = res.data.data.systemPermissions
          this.assignedPermissions = res.data.data.assignedPermissions
        })
    },
    authorized() {
      this.permissionForm.permissions = this.$refs['tree'].getCheckedKeys(true)
      updatePermission(this.permissionForm)
        .then(res => {
          this.$notify.success({
            title: res.data.errmsg,
            message: '已更新角色权限'
          })
          this.isAuthorize = false
        })
        .catch(res => {
          this.$notify.error({
            title: '失败',
            message: res.data.errmsg
          })
          this.isAuthorize = false
        })
    }
  }
}
</script>
<style>
.left {
  margin-left: 4px;
}
</style>
