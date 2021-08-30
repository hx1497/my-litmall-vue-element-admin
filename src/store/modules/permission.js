import { asyncRoutes, constantRoutes } from '@/router'

/**
 * Use meta.role to determine if the current user has permission
 * @param perms
 * @param route
 */
function hasPermission(perms, route) {
  if (route.meta && route.meta.perms) {
    // some(function(e)) 方法用于检测数组中的元素是否满足指定条件（函数提供）. some() 方法会依次执行数组的每个元素
    // some() 方法将数组每个元素传入检测函数，若有一个元素符合条件则返回 true， 剩下不予执行；若无一符合条件，则返回 false
    // some() 方法调用的函数要设置形参以接收 some() 方法的参数
    return perms.some(perm => route.meta.perms.includes(perm))
  } else {
    return true
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param perms
 */
export function filterAsyncRoutes(routes, perms) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(perms, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, perms)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: constantRoutes,
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  generateRoutes({ commit }, data) {
    return new Promise(resolve => {
      const [perms] = data
      let accessedRoutes
      if (perms.includes('*')) {
        accessedRoutes = asyncRoutes
      } else {
        accessedRoutes = filterAsyncRoutes(asyncRoutes, perms)
      }
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
