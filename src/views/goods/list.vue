<template>
  <div class="app-container">

    <!-- 查询与其他操作 -->
    <div class="filter-container">
      <el-input v-model="listQuery.goodsId" clearable class="filter-item" style="width: 160px" placeholder="请输入商品ID" />
      <el-input v-model="listQuery.goodsSn" clearable class="filter-item" style="width: 160px" placeholder="请输入商品编号" />
      <el-input v-model="listQuery.name" clearable class="filter-item" style="width: 160px" placeholder="请输入商品名称" />
      <el-button icon="el-icon-search" class="filter-item" type="primary" @click="handleFliter">查找</el-button>
      <el-button icon="el-icon-edit" class="filter-item" type="primary" @click="handleCreate">添加</el-button>
      <el-button :loading="isLoading" icon="el-icon-download" class="filter-item" type="primary" @click="handleDownload">导出</el-button>

    </div>

    <!-- 商品列表 -->
    <el-table v-loading="listloading" element-loading-text="查询中. . ." :data="list" border fit highlight-current-row>
      <el-table-column type="expand">
        <template slot-scope="scope">
          <el-form>
            <el-form-item label="商品编号">
              <span>{{ scope.row.id }}</span>
            </el-form-item>
            <el-form-item label="宣传画廊">
              <img v-for="item in scope.row.gallery" :key="item" :src="item" class="gallery">
            </el-form-item>
            <el-form-item label="商品介绍">
              <span>{{ scope.row.brief }}</span>
            </el-form-item>
            <el-form-item label="商品单位">
              <span>{{ scope.row.unit }}</span>
            </el-form-item>
            <el-form-item label="关键字">
              <span>{{ scope.row.keywords }}</span>
            </el-form-item>
            <el-form-item label="类目ID">
              <span>{{ scope.row.categoryId }}</span>
            </el-form-item>
            <el-form-item label="品牌商ID">
              <span>{{ scope.row.brandId }}</span>
            </el-form-item>
          </el-form>
        </template>
      </el-table-column>
      <el-table-column align="center" label="商品ID" prop="id" />
      <el-table-column align="center" label="名称" prop="name" />
      <el-table-column align="center" label="图片">
        <template slot-scope="scope">
          <img :src="scope.row.picUrl" width="40">
        </template>
      </el-table-column>
      <el-table-column align="center" label="分享图">
        <template slot-scope="scope">
          <img :src="scope.row.shareUrl" width="40">
        </template>
      </el-table-column>
      <el-table-column align="center" label="详情" prop="detail">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="showDetail(scope.row.detail)">查看</el-button>
          <el-dialog title="商品详情" :visible.sync="isOpen">
            <div class="goods-detail-box" v-html="goodsDetail" />
          </el-dialog>
        </template>
      </el-table-column>
      <el-table-column align="center" label="市场售价" prop="counterPrice" />
      <el-table-column align="center" label="当前价格" prop="retailPrice" />
      <el-table-column align="center" label="是否新品" prop="isNew">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isNew ? 'success' : 'error' "> {{ scope.row.isNew ? '新品' : '非新品' }} </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="是否热品" prop="isHot">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isHot ? 'success' : 'error' "> {{ scope.row.isHot ? '热品' : '非热品' }} </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="是否在售" prop="isOnSale">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isOnSale ? 'success' : 'error' "> {{ scope.row.isOnSale ? '在售' : '非在售' }} </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />
  </div>
</template>
<script>
import { goodsList, deleteGoods } from '@/api/goods'
import BackToTop from '@/components/BackToTop'
import Pagination from '@/components/Pagination'

export default {
  name: 'GoodsList',
  components: { Pagination, BackToTop },
  data() {
    return {
      list: [],
      total: 0,
      listloading: true,
      listQuery: {
        page: 1,
        limit: 20,
        goodsSn: undefined,
        name: undefined,
        order: 'desc',
        sort: 'add_time'
      },
      isOpen: false,
      goodsDetail: '',
      isLoading: false

    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listloading = true
      goodsList(this.listQuery).then(res => {
        console.log('商品列表数据：', res)
        const { list, total } = res.data.data
        this.list = list
        this.total = total
        console.log('list', list, 'total', total)
        this.listloading = false
      }).catch(() => {
        this.list = []
        this.total = 0
        this.listloading = false
      })
    },
    showDetail(detail) {
      this.goodsDetail = detail
      this.isOpen = true
    },
    handleFliter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleCreate() {
      this.$router.push({ path: '/goods/create' })
    },
    handleDownload() {
      this.isLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const theader = ['商品ID', '商品编号', '名称', '专柜价格', '当前价格', '是否新品', '是否热品', '是否在售', '首页主图', '宣传图片列表', '商品介绍', '详细介绍', '商品图片', '商品单位', '关键字', '类目ID', '品牌商ID']
        const fliterVal = ['id', 'goodsSn', 'name', 'counterPrice', 'retailPrice', 'isNew', 'isHot', 'isOnSale', 'listPicUrl', 'gallery', 'brief', 'detail', 'picUrl', 'goodsUnit', 'keywords', 'categoryId', 'brandId']
        excel.export_json_to_excel2(theader, this.list, fliterVal, '商品信息')
        this.isLoading = false
      })
    },
    handleUpdate(row) {
      this.$router.push({ path: '/goods/edit', query: { id: row.id }})// query: { id: row.id }是为了把商品id携带到url地址就是'/goods/edit?id=row.id'
    },
    handleDelete(data) {
      this.$confirm('此操作将删除该商品, 是否继续 ?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }).then(() => {
        deleteGoods(data).then(res => {
          console.log(res)
          this.getList()
          this.$notify.success({
            title: '成功',
            message: '已成功删除'
          })
        }).catch(res => {
          this.$notify.error({
            title: '失败',
            message: res.data.errmsg
          })
        })
      }).catch(() => {
        this.$notify.warning({
          title: '警告',
          message: '操作已取消'
        })
        return
      })
    }
  }
}
</script>
<style >
  .gallery {
    width: 80px;
    margin-right: 10px;
  }
  .goods-detail-box img {
    width: 100%;
  }
</style>
