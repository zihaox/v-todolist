;
(function () {
  'use strict';
  // 封装Object.assign方法
  function copy(obj) {
    return Object.assign({}, obj);
  }

  // 创建事件调度器用于组件间通信
  var Event = new Vue();

  // 封装未完成项为组件
  Vue.component('task', {
    props: ['todo'],
    template: /*html*/ `
            <div class="item">
              <div @click="action('toggle_complete', todo.id)" class="toggle-complete"><div></div></div>
              <span class="title">{{todo.title}}</span>
              <button @click="action('remove',todo.id)">删除</button>
              <button @click="action('set_current',todo)">更新</button>
              <button @click="action('toggle_detail', todo.id)">详情</button>                
              <div v-if="todo.show_detail" class="detail">
                {{todo.desc || '暂无详情'}}
              </div>
            </div>`,
    methods: {
      action: function (name, params) {
        Event.$emit(name, params);
      }
    }
  })

  new Vue({
    el: '#main',
    data: {
      list: [],
      current: {},
      last_id: 0
    },

    // 初始化各项
    mounted: function () {
      var me = this;
      this.list = ms.get('list') || [];
      this.last_id = ms.get('last_id') || this.last_id;

      setInterval(function () {
        me.check_alerts();
      }, 1000);

      Event.$on('remove', function (id) {
        if (id) {
          me.remove(id);
        }
      });

      Event.$on('toggle_complete', function (id) {
        if (id) {
          me.toggle_complete(id);
        }
      });

      Event.$on('set_current', function (todo) {
        if (todo) {
          me.set_current(todo);
        }
      });

      Event.$on('toggle_detail', function (id) {
        if (id) {
          me.toggle_detail(id);
        }
      });
    },

    methods: {
      // 整合增加与更新方法
      merge: function () {
        var is_update, id;
        is_update = id = this.current.id;

        if (is_update) {
          // 找到list中需要更新项的索引，用Vue提供的set方法更新
          // 直接用list[index]更新将不会触发Vue响应系统
          var index = this.find_index(id);
          Vue.set(this.list, index, copy(this.current));
        } else {
          // 向list中添加新项目
          // 空内容将直接返回
          var title = this.current.title;
          if (!title && title !== 0) return;
          // 深拷贝current对象
          var todo = copy(this.current);
          this.last_id++;
          ms.set('last_id', this.last_id);
          todo.id = this.last_id;
          this.list.push(todo);
        }
        // 在每次merge后清空输入框
        this.reset_current();
      },

      toggle_detail: function (id) {
        var index = this.find_index(id);
        Vue.set(this.list[index], 'show_detail', !this.list[index].show_detail)
      },

      remove: function (id) {
        var index = this.find_index(id);
        this.list.splice(index, 1);
      },

      next_id: function () {
        return this.list.length + 1;
      },

      // 将需要更新项拷贝给current对象
      set_current: function (todo) {
        this.current = copy(todo);
        if (this.current.alert_confirmed) {
          this.current.alert_confirmed = false;
        }
        this.get_focus();
      },

      // 重置current对象
      reset_current: function () {
        this.set_current({});
      },

      // 定位作用项
      find_index: function (id) {
        return this.list.findIndex(function (item) {
          return item.id == id;
        })
      },

      // 切换完成状态，使html分别渲染已完成项和未完成项
      toggle_complete: function (id) {
        var index = this.find_index(id);
        Vue.set(this.list[index], 'completed', !this.list[index].completed);
      },

      // 利用Vue提供的ref属性操作DOM（在html中注册引用信息）
      get_focus: function () {
        this.$refs.refinput.focus();
      },

      check_alerts: function () {
        var me = this;
        this.list.forEach(function (item, index) {
          if (!item.alert_at || item.alert_confirmed) return;
          var alert_at = (new Date(item.alert_at)).getTime();
          var now = (new Date()).getTime();
          if (now >= alert_at) {
            var confirmed = confirm(item.title);
            Vue.set(me.list[index], 'alert_confirmed', confirmed);
          }
        });
      }
    },

    // 利用watch属性侦测list变化同时对接localStorage
    watch: {
      list: {
        deep: true,
        handler: function (new_val, old_val) {
          if (new_val) {
            ms.set('list', new_val);
          } else {
            ms.set('list', []);
          }
        }
      }
    }
  });
})();