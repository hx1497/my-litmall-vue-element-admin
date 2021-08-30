<template>
  <div class="app-container">
    <!-- 商品基本信息,数据保存在goods对象 -->
    <el-card class="box-card">
      <h3>商品介绍</h3>
      <el-form ref="goods" :rules="rules" :model="goods" label-width="150px">
        <el-form-item label="商品编号" prop="goodsSn">
          <el-input v-model="goods.goodsSn" />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="goods.name" />
        </el-form-item>
        <el-form-item label="市场售价" prop="counterPrice">
          <el-input v-model="goods.counterPrice" placeholder="0.00">
            <template slot="append">元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="是否新品" prop="isNew">
          <el-radio-group v-model="goods.isNew" size="mini">
            <el-radio :label="true">新品</el-radio>
            <el-radio :label="false">非新品</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否热卖" prop="isHot">
          <el-radio-group v-model="goods.isHot" size="mini">
            <el-radio :label="false">普通</el-radio>
            <el-radio :label="true">热卖</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否在售" prop="isOnSale">
          <el-radio-group v-model="goods.isOnSale" size="mini">
            <el-radio :label="true">在售</el-radio>
            <el-radio :label="false">非在售</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="商品图片">
          <el-upload
            class="avatar-uploader"
            :action="uploadPath"
            :show-file-list="false"
            :headers="headers"
            :on-success="uploadPicUrl"
            accept=".jpg,.jpeg,.png,.gif"
          >
            <img v-if="goods.picUrl" :src="goods.picUrl" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon" />
          </el-upload>
        </el-form-item>
        <!-- 上传文件需要调用后台接口,而接口需要传token 所以需要headers来传入token -->
        <el-form-item label="宣传画廊">
          <el-upload
            :action="uploadPath"
            :headers="headers"
            :on-success="handleGalleryUrl"
            :on-exceed="uploadOverRun"
            :on-remove="handleRemove"
            :limit="5"
            multiple
            list-type="picture-card"
          >
            <i class="el-icon-plus" />
          </el-upload>
        </el-form-item>

        <el-form-item label="商品单位">
          <el-input v-model="goods.unit" placeholder="件/个盒" />
        </el-form-item>

        <el-form-item label="关键字">
          <el-tag
            v-for="tag in dynamicTags"
            :key="tag"
            closable
            :disable-transitions="false"
            @close="handleClose(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="inputVisible"
            ref="saveTagInput"
            v-model="inputValue"
            class="input-new-keyword"
            size="small"
            @keyup.enter.native="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          <el-button v-else type="primary" class="button-new-keyword" size="medium" @click="showInput">+ 增 加</el-button>
        </el-form-item>

        <el-form-item label="所属分类">
          <el-cascader :options="categoryList" expand-trigger="hover" clearable @change="handleCategoryChange" />
        </el-form-item>

        <el-form-item label="所属品牌商">
          <el-select v-model="goods.brandId" clearable>
            <el-option v-for="item in brandList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="商品简介">
          <el-input v-model="goods.brief" />
        </el-form-item>

        <el-form-item label="商品详细介绍">
          <editor v-model="goods.detail" />
        </el-form-item>
      </el-form>
    </el-card>
    <!--
          商品规格信息
          流程: 多规格支持 -> 添加 -> 输入表单信息(数据类型为 object) -> 确定 并经程序将数据处理成 array
              -> el-table拿到数据 -> 展开数据,并显示处理方法 (此例中只有删除)
          数据应保存在数组中,
          便于在el-table中展开处理,但是el-form只能保存对象,所以在保存后需要再次处理
        -->
    <el-card class="box-card">
      <h3>商品规格</h3>
      <el-row :gutter="20" type="flex" align="middle" style="padding: 20px 0;">
        <el-col :span="10">
          <el-radio-group v-model="multipleSpec" @change="changeSpec">
            <el-radio-button :label="false">默认标准规格</el-radio-button>
            <el-radio-button :label="true">多规格支持</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col v-if="multipleSpec" :span="10">
          <el-button :plain="true" type="primary" @click="handleSpecShow">添 加</el-button>
        </el-col>
      </el-row>
      <!-- 表格,从 el表单中拿到经处理后的数据,展开显示,并处理数据 数据类型: array -->
      <el-table :data="tableData">
        <el-table-column align="center" prop="specification" label="规格名" />
        <el-table-column align="center" prop="value" label="规格值">
          <template slot-scope="scope">
            <el-tag type="primary">
              {{ scope.row.value }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="picUrl" label="规格图片">
          <template slot-scope="scope">
            <img v-if="scope.row.picUrl" :src="scope.row.picUrl" width="40">
          </template>
        </el-table-column>
        <el-table-column v-if="multipleSpec" align="center" width="250" class-name="small-padding fixed width" label="操作">
          <template slot-scope="scope">
            <el-button type="danger" size="mini" @click="handleTableDataDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog title="设置规格" :visible.sync="specShow">
        <!-- 表单中保存的数据是 object 类型, 需要转换成 array 类型, 才可以传递给 el-table 处理数据 -->
        <el-form
          ref="specForm"
          :model="specForm"
          status-icon
          label-position="left"
          label-width="80px"
          style="width: 400px; margin-left: 50px"
        >
          <el-form-item label="规格名" prop="specification">
            <el-input v-model="specForm.specification" />
          </el-form-item>
          <el-form-item label="规格值" prop="value">
            <el-input v-model="specForm.value" />
          </el-form-item>
          <el-form-item label="规格图片" prop="picUrl">
            <el-upload
              class="avatar-uploader"
              :action="uploadPath"
              :headers="headers"
              :show-file-list="false"
              :on-success="uploadSpecPicUrl"
              accept=".jpg,.jpeg,.png,.gif"
            >
              <img v-if="specForm.picUrl" :src="specForm.picUrl" class="avatar">
              <i v-else class="el-icon-plus avatar-uploader-icon" />
            </el-upload>
          </el-form-item>
        </el-form>
        <span slot="footer">
          <el-button @click="handleDeleteSpec">取 消</el-button>
          <el-button type="primary" @click="handleSpecAdd">确 定</el-button>
        </span>
      </el-dialog>
    </el-card>

    <!-- 商品库存 -->
    <el-card class="box-card">
      <h3>商品库存</h3>
      <el-table :data="products">
        <el-table-column prop="value" label="货品规格">
          <template slot-scope="scope">
            <el-tag v-for="tag in scope.row.specifications" :key="tag">
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" width="100" label="货品售价" />
        <el-table-column prop="number" width="100" label="货品数量" />
        <el-table-column prop="url" width="100" label="货品图片">
          <template slot-scope="scope">
            <img v-if="scope.row.url" :src="scope.row.url" width="40">
          </template>
        </el-table-column>
        <el-table-column width="100" label="操作" align="center" class-name="small-padding fixed width">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleProductsShow(scope.row)">设置</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog title="添加货品" :visible.sync="isOpenSetting">
        <el-form
          ref="productForm"
          :model="productForm"
          status-icon
          label-position="left"
          label-width="100px"
          style="width: 400px; margin-left: 50px;"
        >
          <el-form-item label="货品规格列" prop="specifications">
            <el-tag v-for="tag in productForm.specifications" :key="tag">
              {{ tag }}
            </el-tag>
          </el-form-item>
          <el-form-item label="货品售价" prop="price">
            <el-input v-model="productForm.price" />
          </el-form-item>
          <el-form-item label="货品数量" prop="number">
            <el-input v-model="productForm.number" />
          </el-form-item>
          <el-form-item label="货品图片" prop="url">
            <el-upload
              class="avatar-uploader"
              :action="uploadPath"
              :headers="headers"
              :show-file-list="false"
              :on-success="uploadProductUrl"
              accept=".jpg,.jpeg,.png,.gif"
            >
              <img v-if="productForm.url" :src="productForm.url" class="avatar">
              <i v-else class="el-icon-plus avatar-uploader-icon" />
            </el-upload>
          </el-form-item>
        </el-form>
        <span slot="footer">
          <el-button @click="isOpenSetting = false">取 消</el-button>
          <el-button type="primary" @click="handleProductEdit">确 定</el-button>
        </span>
      </el-dialog>
    </el-card>

    <!-- 商品参数 -->
    <el-card class="box-card">
      <h3>商品参数</h3>
      <el-button type="primary" @click="visible=true">添加</el-button>
      <el-table :data="params">
        <el-table-column prop="attribute" label="商品参数名称" />
        <el-table-column prop="value" label="商品参数值" />
        <el-table-column align="center" width="100" class-name="small-padding fixed-width" label="操作">
          <template slot-scope="scope">
            <el-button type="danger" size="mini" @click="handleDeleteparam(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog :model="params" :visible.sync="visible" title="添加商品参数">
        <el-form
          ref="paramsForm"
          :model="paramsForm"
          label-position="left"
          status-icon
          label-width="100px"
          style="width: 400px; margin-left: 50px"
        >
          <el-form-item label="商品参数名称" prop="attribute">
            <el-input v-model="paramsForm.attribute" />
          </el-form-item>
          <el-form-item label="商品参数值" prop="value">
            <el-input v-model="paramsForm.value" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="visible = false">取 消</el-button>
          <el-button type="primary" @click="handleParamsAdd">确 定</el-button>
        </div>
      </el-dialog>
    </el-card>

    <div class="op-container">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handlePublish">上架</el-button>
    </div>
  </div>
</template>
<script>
import { listCatAndBrand, publishGoods } from '@/api/goods'
import { uploadPath } from '@/api/storage'
import Editor from '@/components/Tinymce'
import { MessageBox } from 'element-ui'
import { getToken } from '@/utils/auth'
export default {
  name: 'GoodsUpload',
  components: { Editor },
  data() {
    return {
      multipleSpec: false,
      uploadPath,
      dynamicTags: [],
      inputVisible: false,
      inputValue: '',
      categoryList: [],
      brandList: [],
      goods: { picUrl: '', gallery: [], isHot: false, isNew: true, isOnSale: true, goodsSn: '' },
      // 商品规格数据
      specForm: { specification: '', value: '', picUrl: '' },
      tableData: [{ specification: '规格', value: '标准', picUrl: '' }],
      specShow: false,
      // 商品库存数据
      productForm: { id: 0, specifications: ['标准'], price: 0.00, number: 0, url: '' },
      products: [{ id: 0, specifications: ['标准'], price: 0.00, number: 0, url: '' }],
      isOpenSetting: false,
      // 商品参数
      visible: false,
      paramsForm: { attribute: '', value: '' },
      params: [],
      rules: {
        goodsSn: [{ required: true, message: '商品编号不能为空', trigger: 'blur' }],
        name: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }]
      }
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
    this.init()
  },
  methods: {
    // 初始化类目表和商标表
    init: function() {
      listCatAndBrand().then(res => {
        console.log(res)
        this.categoryList = res.data.data.categoryList
        this.brandList = res.data.data.brandList
      })
    },
    // 显示商品图片
    uploadPicUrl(res) {
      console.log(res)
      this.goods.picUrl = res.data.url
    },
    // 图片超出限制
    uploadOverRun() {
      this.$message({
        message: '超出数量限制,最多上传5张!',
        type: 'error'
      })
    },
    // 显示画廊图片
    handleGalleryUrl(res, file, fileList) {
      // console.log(res)
      if (res.errno === 0) {
        this.goods.gallery.push(res.data.url)
        console.log(this.goods.gallery)
      }
    },
    // 移除this.goods.gallery的url
    handleRemove(file, fileList) {
      // console.log(file, fileList)
      // 这里存在两种情况
      // 1. 如果所删除图片是刚刚上传的图片，那么图片地址是file.response.data.url
      //    此时的file.url虽然存在，但是是本机地址，而不是远程地址。
      // 2. 如果所删除图片是后台返回的已有图片，那么图片地址是file.url
      // console.log('fileRes',file.response)
      // console.log('fileUrl',file.url)
      for (var i = 0; i < this.goods.gallery.length; i++) {
        var url
        if (file.response === undefined) {
          url = file.url
        } else {
          url = file.response.data.url
        }
        if (this.goods.gallery[i] === url) {
          this.goods.gallery.splice(i, 1)
        }
      }
      // console.log(this.goods.gallery)
    },
    // 关键字按钮
    showInput() {
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    // 关键字保存tag
    handleInputConfirm() {
      const inputValue = this.inputValue
      // 将输入的标签存入标签数组 dynamicTags 中
      if (inputValue) {
        this.dynamicTags.push(inputValue)
        this.goods.keywords = this.dynamicTags.toString()
        console.log('keywords', this.goods.keywords)
      }
      // 重置 inputVisible 和 inputValue
      this.inputVisible = false
      this.inputValue = ''
    },
    // 关键字标签关闭
    handleClose(tag) {
      this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1)
      this.goods.keywords = this.dynamicTags.toString()
      console.log(this.goods.keywords)
    },
    // 选中所属分类方法
    handleCategoryChange(value) {
      this.goods.categoryId = value[value.length - 1]
    },
    // 切换radio时触发事件
    changeSpec(label) {
      // console.log('prop',prop)
      if (label === false) {
        this.tableData = [{ specification: '规格', value: '标准', picUrl: '' }]
        this.products = [{ id: 0, specification: ['标准'], price: 0.00, number: 0, url: '' }]
      } else {
        this.tableData = []
        this.products = []
      }
    },
    // 点击el table的删除按钮
    handleTableDataDelete(data) {
      // console.log(data)
      const index = this.tableData.indexOf(data)
      this.tableData.splice(index, 1)
      this.specToProduct()
    },
    // 显示规格对话框
    handleSpecShow() {
      this.specShow = true
    },
    // 上传规格图片
    uploadSpecPicUrl(res) {
      this.specForm.picUrl = res.data.url
    },
    // 取消编辑规格
    handleDeleteSpec() {
      console.log('specForm before', this.specForm)
      this.specForm = { specification: '', value: '', picUrl: '' }
      console.log('specForm after', this.specForm)
      this.specShow = false
    },
    // 编辑规格完成  这一步要将specForm中的数据push到tableData中,同时要先检测有无重复的value
    // 先 for 遍历tableData,看看有无与specForm重复的value,如无,就将specForm push到tableData
    // 如果有,则跳出警告并停止执行
    handleSpecAdd() {
      // console.log('table',table)
      var index = this.tableData.length - 1
      // console.log('specForm',this.specForm,'form',form)
      for (let i = 0; i < this.tableData.length; i++) {
        const v = this.tableData[i]
        if (v.specification === this.specForm.specification) {
          if (v.value === this.specForm.value) {
            this.$message({
              message: `已存在规格值:${v.value}`,
              type: 'warning',
              showClose: true
            })
            this.specForm = {}
            this.specShow = false
            return
          } else {
            index = i
          }
        }
      }
      /*  this.tableData.push(this.specForm)
      this.specForm = {} */
      // 不用push而用index 和splice的意义在于排序通过for筛选的都是相同specification的,
      // 可以通过让index=i来定位到最后一个相同specification的值,再通过splice方法来插入到相同specification值的后面,
      // 保证specification相同的数据都在同一组,方便接下来 specToProduct 处理
      this.tableData.splice(index + 1, 0, this.specForm)
      this.specForm = {}
      // console.log('tableData',this.tableData)
      // console.log('data', this.tableData[0])
      this.specShow = false

      this.specToProduct()
    },
    // 根据tableData生成products
    specToProduct() {
      if (this.tableData.length === 0) {
        return
      }
      // 根据tableData生成临时规格表
      // 利用笛卡尔乘积
      // 数学原理: 设有A, B 集合 A与B的笛卡尔乘积记作A×B, 即 A×B={<x, y> | x∈A, y∈B}.
      // 实例: A=[1, 2, 3], B=[a, b, c]
      // A×B = {<1, a>, <1,b>, <1,c>, <2,a>, <2,b>, <2,c>, <3,a>, <3,b>, <3,c> }
      // A*B 有多少个元素呢? 设 A 有 m 个元素, B 有n个元素,则 A*B有 m*n个元素
      // 需要将tableData 中的数据按照不同 规格名 specification 分成不同的 数组, 数组保存的值为 value
      // tableData[i].specification 如果相同,将value保存在同一个数组中, 否则保存在不同数组中
      // 分好组后再进行笛卡尔乘积

      // 先将tableData按照tableData[i].specification的同异分组(同的一组,异的另分组)
      const specValue = []
      var spec = this.tableData[0].specifications
      var values = []
      values.push(this.tableData[0].value)

      for (var i = 1; i < this.tableData.length; i++) {
        var valid = this.tableData[i].specifications
        var validValue = this.tableData[i].value

        if (spec === valid) {
          // 数组 values 保存的是存的是 this.tableData 中相同 specification 的value a:[v1,v2,v3,v4]
          values.push(validValue)
        } else {
          // specValue 是经过处理的value数组的集合, 每一个数组都是相同 specification 的不同value
          // (相同specification相同value的已经在输入时被筛选掉了)
          // specValue = [ arr1, arr2, arr3, ..., arrN ] 每个arr 都是 tableData 中 specification相同的value
          specValue.push(values)
          spec = valid
          values = []
          values.push(validValue)
        }
      }
      specValue.push(values)
      // console.log('specValue', specValue)

      // 预处理好数据后开始进行笛卡尔乘积
      var productList = this.cartesianProductOf(...specValue)
      const products = []
      console.log(productList)
      productList.forEach(function(value, index) {
        console.log('value:', value, 'index:', index)
        products[index] = { id: index, specifications: value, price: 0.00, number: 0, url: '' }
      })
      this.products = products
    },
    // 笛卡尔乘积函数
    cartesianProductOf() {
      return Array.prototype.reduce.call(arguments, function(a, b) {
        var ret = []
        a.forEach(function(a) {
          b.forEach(function(b) {
            ret.push(a.concat([b]))
          })
        })
        return ret
      }, [[]])
    },
    // 商品库存 - 操作
    // 上传库存图片
    uploadProductUrl(res) {
      this.productForm.url = res.data.url
    },
    handleProductsShow(data) {
      // 拿到的 data 是products数组中的对象{id, specification, number, price, url}
      // postForm的值被 data 覆盖
      this.productForm = Object.assign({}, data)
      this.isOpenSetting = true
    },
    // 库存设置完成
    handleProductEdit() {
      // 将 handleProductsShow 传过来的 data 替换成postForm的数据
      for (var i = 0; i < this.products.length; i++) {
        const v = this.products[i]
        if (v.id === this.productForm.id) {
          this.products.splice(i, 1, this.productForm)
          break
        }
      }
      this.isOpenSetting = false
    },
    // 删除参数设置
    handleDeleteparam(row) {
      const index = this.params.indexOf(row)
      this.params.splice(index, 1)
    },
    // 参数设置完成
    handleParamsAdd() {
      this.params.unshift(this.paramsForm)
      this.visible = false
    },
    // 上架
    handlePublish() {
      const finalGoods = {
        goods: this.goods,
        specifications: this.tableData,
        products: this.products,
        attributes: this.params
      }
      publishGoods(finalGoods).then(response => {
        this.$notify.success({
          title: '成功',
          message: '创建成功'
        })
        this.$store.dispatch('tagsView/delView', this.$route)
        this.$router.push({ path: '/goods/list' })
      }).catch(response => {
        MessageBox.alert('业务错误：' + response.data.errmsg, '警告', {
          confirmButtonText: '确定',
          type: 'error'
        })
      })
    },
    // 取消上架
    handleCancel() {
      this.$store.dispatch('tagsView/delView', this.$route)
      this.$router.push({ path: '/goods/list' })
    }
  }
}
</script>

<style>
.button-new-keyword {
  margin-left: 4px;
}
.el-card {
  margin-bottom: 10px;
}
.el-tag + .el-tag {
    margin-left: 10px;
  }

  .input-new-keyword {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
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
