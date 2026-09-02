<template>
  <div class="icon-picker">
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索图标..."
        class="search-input"
      />
    </div>

    <div class="categories-tabs">
      <button
        v-for="cat in iconCategories"
        :key="cat.key"
        :class="['tab', { active: activeCategory === cat.key }]"
        @click="activeCategory = cat.key"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="icons-grid">
      <button
        v-for="icon in displayedIcons"
        :key="icon.emoji"
        :class="['icon-item', { selected: modelValue === icon.emoji }]"
        @click="selectIcon(icon.emoji)"
        :title="icon.name"
      >
        {{ icon.emoji }}
      </button>
    </div>

    <!-- 展开/收起按钮 -->
    <div v-if="!searchQuery && filteredIcons.length > 16" class="expand-section">
      <button class="expand-btn" @click="toggleExpand">
        <span v-if="!isExpanded">显示更多 ({{ filteredIcons.length - 16 }}+)</span>
        <span v-else>收起</span>
        <span class="expand-icon">{{ isExpanded ? '▲' : '▼' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref('')
const activeCategory = ref('all')
const isExpanded = ref(false)

// 图标库 - 按场景分类
const iconLibrary = {
  food: [
    { emoji: '🍜', name: '面食' },
    { emoji: '🍚', name: '米饭' },
    { emoji: '🍕', name: '披萨' },
    { emoji: '🍔', name: '汉堡' },
    { emoji: '🍟', name: '薯条' },
    { emoji: '🌭', name: '热狗' },
    { emoji: '🥪', name: '三明治' },
    { emoji: '🌮', name: '塔可' },
    { emoji: '🌯', name: '卷饼' },
    { emoji: '🥗', name: '沙拉' },
    { emoji: '🥙', name: '口袋饼' },
    { emoji: '🍳', name: '煎蛋' },
    { emoji: '🥘', name: '炖菜' },
    { emoji: '🍲', name: '火锅' },
    { emoji: '🍱', name: '便当' },
    { emoji: '🍛', name: '咖喱' },
    { emoji: '🍝', name: '意面' },
    { emoji: '🥟', name: '饺子' },
    { emoji: '🥠', name: '馄饨' },
    { emoji: '🍢', name: '串串' },
    { emoji: '🍡', name: '丸子' },
    { emoji: '🍧', name: '刨冰' },
    { emoji: '🍨', name: '冰淇淋' },
    { emoji: '🍦', name: '甜筒' },
    { emoji: '🥧', name: '派' },
    { emoji: '🧁', name: '纸杯蛋糕' },
    { emoji: '🍰', name: '蛋糕' },
    { emoji: '🎂', name: '生日蛋糕' },
    { emoji: '🍮', name: '布丁' },
    { emoji: '🍭', name: '棒棒糖' },
    { emoji: '🍬', name: '糖果' },
    { emoji: '🍫', name: '巧克力' },
    { emoji: '🍿', name: '爆米花' },
    { emoji: '🍩', name: '甜甜圈' },
    { emoji: '🍪', name: '饼干' },
    { emoji: '🥮', name: '月饼' },
  ],
  drink: [
    { emoji: '☕', name: '咖啡' },
    { emoji: '🍵', name: '茶' },
    { emoji: '🧃', name: '果汁盒' },
    { emoji: '🥤', name: '饮料' },
    { emoji: '🧋', name: '奶茶' },
    { emoji: '🍶', name: '清酒' },
    { emoji: '🍺', name: '啤酒' },
    { emoji: '🍻', name: '干杯' },
    { emoji: '🥂', name: '碰杯' },
    { emoji: '🍷', name: '红酒' },
    { emoji: '🥃', name: '威士忌' },
    { emoji: '🍸', name: '鸡尾酒' },
    { emoji: '🍹', name: '热带饮料' },
    { emoji: '🧊', name: '冰块' },
    { emoji: '🥛', name: '牛奶' },
    { emoji: '🍼', name: '奶瓶' },
  ],
  transport: [
    { emoji: '🚗', name: '汽车' },
    { emoji: '🚕', name: '出租车' },
    { emoji: '🚙', name: 'SUV' },
    { emoji: '🚌', name: '公交' },
    { emoji: '🚎', name: '无轨电车' },
    { emoji: '🏎️', name: '赛车' },
    { emoji: '🚓', name: '警车' },
    { emoji: '🚑', name: '救护车' },
    { emoji: '🚒', name: '消防车' },
    { emoji: '🚐', name: '面包车' },
    { emoji: '🚚', name: '货车' },
    { emoji: '🚛', name: '拖车' },
    { emoji: '🚜', name: '拖拉机' },
    { emoji: '🛵', name: '摩托车' },
    { emoji: '🏍️', name: '摩托' },
    { emoji: '🛺', name: '三轮车' },
    { emoji: '🚲', name: '自行车' },
    { emoji: '🛴', name: '滑板车' },
    { emoji: '🚇', name: '地铁' },
    { emoji: '🚆', name: '火车' },
    { emoji: '🚄', name: '高铁' },
    { emoji: '🚅', name: '子弹列车' },
    { emoji: '🚈', name: '轻轨' },
    { emoji: '🚝', name: '单轨' },
    { emoji: '🚞', name: '山地列车' },
    { emoji: '🚋', name: '有轨电车' },
    { emoji: '🚃', name: '车厢' },
    { emoji: '🚟', name: '缆车' },
    { emoji: '🚠', name: '索道' },
    { emoji: '🚡', name: '缆车' },
    { emoji: '✈️', name: '飞机' },
    { emoji: '🛫', name: '起飞' },
    { emoji: '🛬', name: '降落' },
    { emoji: '🚁', name: '直升机' },
    { emoji: '🛩️', name: '小飞机' },
    { emoji: '🚀', name: '火箭' },
    { emoji: '🛸', name: 'UFO' },
    { emoji: '🚢', name: '船' },
    { emoji: '⛴️', name: '渡轮' },
    { emoji: '🛳️', name: '客轮' },
    { emoji: '⛵', name: '帆船' },
    { emoji: '🚤', name: '快艇' },
    { emoji: '🛥️', name: '游艇' },
    { emoji: '⛽', name: '加油站' },
    { emoji: '🅿️', name: '停车' },
  ],
  shopping: [
    { emoji: '🛒', name: '购物车' },
    { emoji: '🛍️', name: '购物袋' },
    { emoji: '💳', name: '信用卡' },
    { emoji: '💰', name: '钱袋' },
    { emoji: '💵', name: '钞票' },
    { emoji: '💴', name: '日元' },
    { emoji: '💶', name: '欧元' },
    { emoji: '💷', name: '英镑' },
    { emoji: '🏪', name: '便利店' },
    { emoji: '🏬', name: '商场' },
    { emoji: '🛏️', name: '床' },
    { emoji: '🛋️', name: '沙发' },
    { emoji: '🪑', name: '椅子' },
    { emoji: '🚪', name: '门' },
    { emoji: '🪟', name: '窗户' },
    { emoji: '🧺', name: '篮子' },
    { emoji: '🧴', name: '洗护' },
    { emoji: '🧼', name: '肥皂' },
    { emoji: '🧽', name: '海绵' },
    { emoji: '🧹', name: '扫帚' },
    { emoji: '🧻', name: '纸巾' },
    { emoji: '🔦', name: '手电筒' },
    { emoji: '💡', name: '灯泡' },
    { emoji: '🕯️', name: '蜡烛' },
    { emoji: '🧯', name: '灭火器' },
  ],
  life: [
    { emoji: '🏠', name: '房子' },
    { emoji: '🏡', name: '别墅' },
    { emoji: '🏘️', name: '住宅' },
    { emoji: '🏚️', name: '老房子' },
    { emoji: '🏗️', name: '建筑' },
    { emoji: '🏢', name: '办公楼' },
    { emoji: '🏣', name: '邮局' },
    { emoji: '🏤', name: '邮政' },
    { emoji: '🏥', name: '医院' },
    { emoji: '🏦', name: '银行' },
    { emoji: '🏨', name: '酒店' },
    { emoji: '🏩', name: '情侣酒店' },
    { emoji: '💒', name: '教堂' },
    { emoji: '⛪', name: '教堂' },
    { emoji: '🕌', name: '清真寺' },
    { emoji: '🛕', name: '寺庙' },
    { emoji: '🕍', name: '犹太教堂' },
    { emoji: '⛩️', name: '神社' },
    { emoji: '🕋', name: '天房' },
    { emoji: '💊', name: '药' },
    { emoji: '💉', name: '注射' },
    { emoji: '🩹', name: '创可贴' },
    { emoji: '🩺', name: '听诊器' },
    { emoji: '🌡️', name: '体温计' },
    { emoji: '🧬', name: 'DNA' },
    { emoji: '🔬', name: '显微镜' },
    { emoji: '🔭', name: '望远镜' },
    { emoji: '📡', name: '天线' },
    { emoji: '💈', name: '理发店' },
    { emoji: '🧴', name: '护肤品' },
    { emoji: '🧼', name: '清洁' },
    { emoji: '🧽', name: '打扫' },
    { emoji: '🧹', name: '清扫' },
    { emoji: '🪒', name: '剃须刀' },
    { emoji: '🧺', name: '洗衣' },
    { emoji: '🧦', name: '袜子' },
    { emoji: '👔', name: '领带' },
    { emoji: '👕', name: 'T恤' },
    { emoji: '👖', name: '裤子' },
    { emoji: '🧥', name: '外套' },
    { emoji: '👗', name: '裙子' },
    { emoji: '👘', name: '和服' },
    { emoji: '👙', name: '比基尼' },
    { emoji: '👚', name: '女装' },
    { emoji: '👛', name: '钱包' },
    { emoji: '👜', name: '手提包' },
    { emoji: '👝', name: '包' },
    { emoji: '🎒', name: '书包' },
    { emoji: '👞', name: '皮鞋' },
    { emoji: '👟', name: '运动鞋' },
    { emoji: '🥾', name: '登山鞋' },
    { emoji: '🥿', name: '平底鞋' },
    { emoji: '👠', name: '高跟鞋' },
    { emoji: '👡', name: '凉鞋' },
    { emoji: '👢', name: '靴子' },
    { emoji: '🩴', name: '人字拖' },
    { emoji: '👓', name: '眼镜' },
    { emoji: '🕶️', name: '太阳镜' },
    { emoji: '🥽', name: '护目镜' },
    { emoji: '👑', name: '皇冠' },
    { emoji: '👒', name: '帽子' },
    { emoji: '🎩', name: '礼帽' },
    { emoji: '🎓', name: '学士帽' },
    { emoji: '🧢', name: '鸭舌帽' },
    { emoji: '⛑️', name: '安全帽' },
    { emoji: '💄', name: '口红' },
    { emoji: '💍', name: '戒指' },
    { emoji: '💎', name: '钻石' },
  ],
  education: [
    { emoji: '📚', name: '书籍' },
    { emoji: '📖', name: '打开的书' },
    { emoji: '📕', name: '红色书' },
    { emoji: '📗', name: '绿色书' },
    { emoji: '📘', name: '蓝色书' },
    { emoji: '📙', name: '橙色书' },
    { emoji: '📓', name: '笔记本' },
    { emoji: '📔', name: '记事本' },
    { emoji: '📒', name: '账本' },
    { emoji: '📃', name: '文件' },
    { emoji: '📜', name: '卷轴' },
    { emoji: '📄', name: '纸' },
    { emoji: '📰', name: '报纸' },
    { emoji: '🗞️', name: '卷起的报纸' },
    { emoji: '📑', name: '书签标签' },
    { emoji: '🔖', name: '书签' },
    { emoji: '🏷️', name: '标签' },
    { emoji: '✏️', name: '铅笔' },
    { emoji: '✒️', name: '钢笔' },
    { emoji: '🖊️', name: '圆珠笔' },
    { emoji: '🖋️', name: '钢笔' },
    { emoji: '🖌️', name: '画笔' },
    { emoji: '🖍️', name: '蜡笔' },
    { emoji: '📝', name: '备忘录' },
    { emoji: '📐', name: '三角尺' },
    { emoji: '📏', name: '直尺' },
    { emoji: '📌', name: '图钉' },
    { emoji: '📍', name: '定位针' },
    { emoji: '✂️', name: '剪刀' },
    { emoji: '🗃️', name: '文件盒' },
    { emoji: '🗂️', name: '卡片索引' },
    { emoji: '🗄️', name: '文件柜' },
    { emoji: '📋', name: '剪贴板' },
    { emoji: '📁', name: '文件夹' },
    { emoji: '📂', name: '打开的文件夹' },
    { emoji: '🗒️', name: '便签' },
    { emoji: '🗓️', name: '日历' },
    { emoji: '📅', name: '日期' },
    { emoji: '📆', name: '日历' },
    { emoji: '🎓', name: '毕业' },
    { emoji: '🎒', name: '书包' },
    { emoji: '🏫', name: '学校' },
    { emoji: '🏛️', name: '古典建筑' },
    { emoji: '🔬', name: '实验' },
    { emoji: '🔭', name: '天文' },
    { emoji: '🧪', name: '试管' },
    { emoji: '🧫', name: '培养皿' },
    { emoji: '🧬', name: '基因' },
    { emoji: '🔍', name: '搜索' },
    { emoji: '🔎', name: '放大镜' },
  ],
  entertainment: [
    { emoji: '🎮', name: '游戏' },
    { emoji: '🕹️', name: '游戏手柄' },
    { emoji: '🎯', name: '飞镖' },
    { emoji: '🎲', name: '骰子' },
    { emoji: '🎰', name: '老虎机' },
    { emoji: '🎳', name: '保龄球' },
    { emoji: '🎱', name: '台球' },
    { emoji: '🎬', name: '电影' },
    { emoji: '🎭', name: '戏剧' },
    { emoji: '🎪', name: '马戏团' },
    { emoji: '🎨', name: '艺术' },
    { emoji: '🎤', name: '麦克风' },
    { emoji: '🎧', name: '耳机' },
    { emoji: '🎼', name: '乐谱' },
    { emoji: '🎹', name: '钢琴' },
    { emoji: '🥁', name: '鼓' },
    { emoji: '🎷', name: '萨克斯' },
    { emoji: '🎺', name: '小号' },
    { emoji: '🎸', name: '吉他' },
    { emoji: '🪕', name: '班卓琴' },
    { emoji: '🎻', name: '小提琴' },
    { emoji: '🎶', name: '音符' },
    { emoji: '🎵', name: '音乐' },
    { emoji: '🎙️', name: '录音' },
    { emoji: '📻', name: '收音机' },
    { emoji: '📺', name: '电视' },
    { emoji: '📹', name: '摄像机' },
    { emoji: '📷', name: '相机' },
    { emoji: '📸', name: '拍照' },
    { emoji: '🎞️', name: '胶卷' },
    { emoji: '🎟️', name: '门票' },
    { emoji: '🎫', name: '票' },
    { emoji: '🏆', name: '奖杯' },
    { emoji: '🥇', name: '金牌' },
    { emoji: '🥈', name: '银牌' },
    { emoji: '🥉', name: '铜牌' },
    { emoji: '⚽', name: '足球' },
    { emoji: '⚾', name: '棒球' },
    { emoji: '🥎', name: '垒球' },
    { emoji: '🏀', name: '篮球' },
    { emoji: '🏐', name: '排球' },
    { emoji: '🏈', name: '橄榄球' },
    { emoji: '🏉', name: '英式橄榄球' },
    { emoji: '🎾', name: '网球' },
    { emoji: '🥏', name: '飞盘' },
    { emoji: '🎳', name: '保龄球' },
    { emoji: '🏏', name: '板球' },
    { emoji: '🏑', name: '曲棍球' },
    { emoji: '🏒', name: '冰球' },
    { emoji: '🥍', name: '长曲棍球' },
    { emoji: '🏓', name: '乒乓球' },
    { emoji: '🏸', name: '羽毛球' },
    { emoji: '🥊', name: '拳击' },
    { emoji: '🥋', name: '武术' },
    { emoji: '🥅', name: '球门' },
    { emoji: '⛳', name: '高尔夫' },
    { emoji: '⛸️', name: '滑冰' },
    { emoji: '🎣', name: '钓鱼' },
    { emoji: '🤿', name: '潜水' },
    { emoji: '🎿', name: '滑雪' },
    { emoji: '🛷', name: '雪橇' },
    { emoji: '🏋️', name: '举重' },
    { emoji: '🤼', name: '摔跤' },
    { emoji: '🤸', name: '体操' },
    { emoji: '🤺', name: '击剑' },
    { emoji: '🤾', name: '手球' },
    { emoji: '🏌️', name: '打高尔夫' },
    { emoji: '🏄', name: '冲浪' },
    { emoji: '🏊', name: '游泳' },
    { emoji: '🚣', name: '划船' },
    { emoji: '🧗', name: '攀岩' },
    { emoji: '🚴', name: '骑行' },
    { emoji: '🚵', name: '山地车' },
    { emoji: '🏇', name: '赛马' },
    { emoji: '🧘', name: '瑜伽' },
  ],
  digital: [
    { emoji: '📱', name: '手机' },
    { emoji: '📲', name: '电话' },
    { emoji: '☎️', name: '固定电话' },
    { emoji: '📞', name: '电话' },
    { emoji: '📟', name: '寻呼机' },
    { emoji: '📠', name: '传真机' },
    { emoji: '💻', name: '电脑' },
    { emoji: '🖥️', name: '台式机' },
    { emoji: '🖨️', name: '打印机' },
    { emoji: '⌨️', name: '键盘' },
    { emoji: '🖱️', name: '鼠标' },
    { emoji: '🖲️', name: '轨迹球' },
    { emoji: '💽', name: 'MD' },
    { emoji: '💾', name: '软盘' },
    { emoji: '💿', name: 'CD' },
    { emoji: '📀', name: 'DVD' },
    { emoji: '🧮', name: '算盘' },
    { emoji: '🎥', name: '电影摄影机' },
    { emoji: '🎬', name: '场记板' },
    { emoji: '📽️', name: '电影放映机' },
    { emoji: '📺', name: '电视' },
    { emoji: '📻', name: '收音机' },
    { emoji: '🎙️', name: '麦克风' },
    { emoji: '🎚️', name: '调音台' },
    { emoji: '🎛️', name: '控制旋钮' },
    { emoji: '🧭', name: '指南针' },
    { emoji: '⏱️', name: '秒表' },
    { emoji: '⏲️', name: '计时器' },
    { emoji: '⏰', name: '闹钟' },
    { emoji: '🕰️', name: '时钟' },
    { emoji: '⌛', name: '沙漏' },
    { emoji: '⏳', name: '流沙' },
    { emoji: '📡', name: '卫星天线' },
    { emoji: '🔋', name: '电池' },
    { emoji: '🔌', name: '插头' },
    { emoji: '💡', name: '灯泡' },
    { emoji: '🔦', name: '手电筒' },
    { emoji: '🕯️', name: '蜡烛' },
    { emoji: '🪔', name: '油灯' },
    { emoji: '🧯', name: '灭火器' },
  ],
  finance: [
    { emoji: '💰', name: '钱袋' },
    { emoji: '💴', name: '日元' },
    { emoji: '💵', name: '美元' },
    { emoji: '💶', name: '欧元' },
    { emoji: '💷', name: '英镑' },
    { emoji: '💸', name: '飞走的钱' },
    { emoji: '💳', name: '信用卡' },
    { emoji: '💹', name: '图表上升' },
    { emoji: '💱', name: '货币兑换' },
    { emoji: '💲', name: '美元符号' },
    { emoji: '🏦', name: '银行' },
    { emoji: '🏧', name: 'ATM' },
    { emoji: '📈', name: '上升趋势' },
    { emoji: '📉', name: '下降趋势' },
    { emoji: '📊', name: '柱状图' },
    { emoji: '🧾', name: '收据' },
    { emoji: '💼', name: '公文包' },
    { emoji: '📁', name: '文件夹' },
    { emoji: '📂', name: '打开文件夹' },
    { emoji: '🗂️', name: '卡片索引分隔' },
    { emoji: '📇', name: '卡片索引' },
    { emoji: '📋', name: '剪贴板' },
    { emoji: '📊', name: '图表' },
    { emoji: '📈', name: '增长' },
    { emoji: '💎', name: '钻石' },
    { emoji: '💍', name: '戒指' },
    { emoji: '👑', name: '皇冠' },
  ],
  travel: [
    { emoji: '✈️', name: '飞机' },
    { emoji: '🛫', name: '起飞' },
    { emoji: '🛬', name: '降落' },
    { emoji: '🧳', name: '行李箱' },
    { emoji: '⛱️', name: '沙滩伞' },
    { emoji: '🏖️', name: '沙滩' },
    { emoji: '🏝️', name: '荒岛' },
    { emoji: '🗾', name: '日本地图' },
    { emoji: '🗺️', name: '世界地图' },
    { emoji: '🧭', name: '指南针' },
    { emoji: '🗿', name: '摩艾' },
    { emoji: '🗽', name: '自由女神' },
    { emoji: '🗼', name: '东京塔' },
    { emoji: '🏰', name: '城堡' },
    { emoji: '🏯', name: '日本城堡' },
    { emoji: '🏟️', name: '体育场' },
    { emoji: '🎡', name: '摩天轮' },
    { emoji: '🎢', name: '过山车' },
    { emoji: '🎠', name: '旋转木马' },
    { emoji: '⛲', name: '喷泉' },
    { emoji: '⛺', name: '帐篷' },
    { emoji: '🏕️', name: '露营' },
    { emoji: '🗻', name: '富士山' },
    { emoji: '🏔️', name: '雪山' },
    { emoji: '⛰️', name: '山' },
    { emoji: '🌋', name: '火山' },
    { emoji: '🏜️', name: '沙漠' },
    { emoji: '🏞️', name: '国家公园' },
    { emoji: '🛤️', name: '铁轨' },
    { emoji: '🛣️', name: '高速公路' },
    { emoji: '🗾', name: '地图' },
  ],
  other: [
    { emoji: '❤️', name: '红心' },
    { emoji: '🧡', name: '橙心' },
    { emoji: '💛', name: '黄心' },
    { emoji: '💚', name: '绿心' },
    { emoji: '💙', name: '蓝心' },
    { emoji: '💜', name: '紫心' },
    { emoji: '🖤', name: '黑心' },
    { emoji: '🤍', name: '白心' },
    { emoji: '🤎', name: '棕心' },
    { emoji: '💔', name: '心碎' },
    { emoji: '❣️', name: '心形感叹号' },
    { emoji: '💕', name: '两颗心' },
    { emoji: '💞', name: '旋转的心' },
    { emoji: '💓', name: '心跳' },
    { emoji: '💗', name: '成长的心' },
    { emoji: '💖', name: '闪耀的心' },
    { emoji: '💘', name: '丘比特之箭' },
    { emoji: '💝', name: '心形礼物' },
    { emoji: '💟', name: '心形装饰' },
    { emoji: '☮️', name: '和平' },
    { emoji: '✝️', name: '十字架' },
    { emoji: '☪️', name: '星月' },
    { emoji: '🕉️', name: '唵' },
    { emoji: '☸️', name: '法轮' },
    { emoji: '✡️', name: '大卫星' },
    { emoji: '🔯', name: '六芒星' },
    { emoji: '🕎', name: '烛台' },
    { emoji: '☯️', name: '太极' },
    { emoji: '☦️', name: '东正教十字' },
    { emoji: '🛐', name: '礼拜场所' },
    { emoji: '⛎', name: '蛇夫座' },
    { emoji: '♈', name: '白羊座' },
    { emoji: '♉', name: '金牛座' },
    { emoji: '♊', name: '双子座' },
    { emoji: '♋', name: '巨蟹座' },
    { emoji: '♌', name: '狮子座' },
    { emoji: '♍', name: '处女座' },
    { emoji: '♎', name: '天秤座' },
    { emoji: '♏', name: '天蝎座' },
    { emoji: '♐', name: '射手座' },
    { emoji: '♑', name: '摩羯座' },
    { emoji: '♒', name: '水瓶座' },
    { emoji: '♓', name: '双鱼座' },
    { emoji: '🆔', name: 'ID' },
    { emoji: '⚛️', name: '原子' },
    { emoji: '🔴', name: '红圆' },
    { emoji: '🟠', name: '橙圆' },
    { emoji: '🟡', name: '黄圆' },
    { emoji: '🟢', name: '绿圆' },
    { emoji: '🔵', name: '蓝圆' },
    { emoji: '🟣', name: '紫圆' },
    { emoji: '🟤', name: '棕圆' },
    { emoji: '⚫', name: '黑圆' },
    { emoji: '⚪', name: '白圆' },
    { emoji: '🟥', name: '红方' },
    { emoji: '🟧', name: '橙方' },
    { emoji: '🟨', name: '黄方' },
    { emoji: '🟩', name: '绿方' },
    { emoji: '🟦', name: '蓝方' },
    { emoji: '🟪', name: '紫方' },
    { emoji: '🟫', name: '棕方' },
    { emoji: '⬛', name: '黑方' },
    { emoji: '⬜', name: '白方' },
    { emoji: '🔶', name: '橙色菱形' },
    { emoji: '🔷', name: '蓝色菱形' },
    { emoji: '🔸', name: '小橙色菱形' },
    { emoji: '🔹', name: '小蓝色菱形' },
    { emoji: '🔺', name: '红色三角形' },
    { emoji: '🔻', name: '倒红色三角形' },
    { emoji: '💠', name: '钻石形状' },
    { emoji: '🔘', name: '单选按钮' },
    { emoji: '🔳', name: '白色按钮' },
    { emoji: '🔲', name: '黑色按钮' },
    { emoji: '✅', name: '勾选' },
    { emoji: '☑️', name: '勾选框' },
    { emoji: '✔️', name: '勾' },
    { emoji: '✖️', name: '叉' },
    { emoji: '❌', name: '叉号' },
    { emoji: '❎', name: '叉号按钮' },
    { emoji: '➕', name: '加号' },
    { emoji: '➖', name: '减号' },
    { emoji: '➗', name: '除号' },
    { emoji: '✖️', name: '乘号' },
    { emoji: '💯', name: '100分' },
    { emoji: '💢', name: '怒' },
    { emoji: '💥', name: '爆炸' },
    { emoji: '💫', name: '眩晕' },
    { emoji: '💦', name: '汗滴' },
    { emoji: '💨', name: '冲' },
    { emoji: '🕳️', name: '洞' },
    { emoji: '💬', name: '对话气泡' },
    { emoji: '💭', name: '思考气泡' },
    { emoji: '🗯️', name: '愤怒气泡' },
    { emoji: '🔇', name: '静音' },
    { emoji: '🔈', name: '音量小' },
    { emoji: '🔉', name: '音量中' },
    { emoji: '🔊', name: '音量大' },
    { emoji: '📢', name: '扩音器' },
    { emoji: '📣', name: '喇叭' },
    { emoji: '📯', name: '号角' },
    { emoji: '🔔', name: '铃铛' },
    { emoji: '🔕', name: '铃铛静音' },
    { emoji: '🎼', name: '乐谱' },
    { emoji: '🎶', name: '音符' },
    { emoji: '🎵', name: '单音符' },
    { emoji: '🎸', name: '吉他' },
    { emoji: '👍', name: '赞' },
    { emoji: '👎', name: '踩' },
    { emoji: '👏', name: '鼓掌' },
    { emoji: '🙌', name: '举手' },
    { emoji: '👐', name: '张开双手' },
    { emoji: '🤲', name: '合十' },
    { emoji: '🤝', name: '握手' },
    { emoji: '🙏', name: '祈祷' },
    { emoji: '✍️', name: '写字' },
    { emoji: '💅', name: '涂指甲' },
    { emoji: '🤳', name: '自拍' },
    { emoji: '💪', name: '肌肉' },
    { emoji: '🦾', name: '机械臂' },
    { emoji: '🦿', name: '机械腿' },
    { emoji: '🦵', name: '腿' },
    { emoji: '🦶', name: '脚' },
    { emoji: '👂', name: '耳朵' },
    { emoji: '🦻', name: '助听器' },
    { emoji: '👃', name: '鼻子' },
    { emoji: '🧠', name: '大脑' },
    { emoji: '🦷', name: '牙齿' },
    { emoji: '🦴', name: '骨头' },
    { emoji: '👀', name: '眼睛' },
    { emoji: '👁️', name: '眼' },
    { emoji: '👅', name: '舌头' },
    { emoji: '👄', name: '嘴唇' },
    { emoji: '🌟', name: '星星' },
    { emoji: '⭐', name: '五角星' },
    { emoji: '✨', name: '闪耀' },
    { emoji: '⚡', name: '闪电' },
    { emoji: '🔥', name: '火' },
    { emoji: '💧', name: '水滴' },
    { emoji: '🌊', name: '浪' },
    { emoji: '🎁', name: '礼物' },
    { emoji: '🎀', name: '蝴蝶结' },
    { emoji: '🎈', name: '气球' },
    { emoji: '🎉', name: '彩带' },
    { emoji: '🎊', name: '彩球' },
    { emoji: '🎋', name: '七夕树' },
    { emoji: '🎍', name: '门松' },
    { emoji: '🎎', name: '日本娃娃' },
    { emoji: '🎏', name: '鲤鱼旗' },
    { emoji: '🎐', name: '风铃' },
    { emoji: '🎑', name: '赏月' },
    { emoji: '🎃', name: '南瓜' },
    { emoji: '👻', name: '鬼' },
    { emoji: '🎅', name: '圣诞老人' },
    { emoji: '🎄', name: '圣诞树' },
    { emoji: '🎆', name: '烟火' },
    { emoji: '🎇', name: '烟花' },
  ]
}

const iconCategories = [
  { key: 'all', label: '全部' },
  { key: 'food', label: '🍜 饮食' },
  { key: 'drink', label: '☕ 饮品' },
  { key: 'transport', label: '🚗 交通' },
  { key: 'shopping', label: '🛒 购物' },
  { key: 'life', label: '🏠 生活' },
  { key: 'education', label: '📚 教育' },
  { key: 'entertainment', label: '🎮 娱乐' },
  { key: 'digital', label: '💻 数码' },
  { key: 'finance', label: '💰 金融' },
  { key: 'travel', label: '✈️ 旅行' },
  { key: 'other', label: '⭐ 其他' },
]

const filteredIcons = computed(() => {
  let icons = []

  if (activeCategory.value === 'all') {
    // 所有图标
    icons = Object.values(iconLibrary).flat()
  } else {
    // 指定分类的图标
    icons = iconLibrary[activeCategory.value] || []
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    icons = icons.filter(icon =>
      icon.name.toLowerCase().includes(query) ||
      icon.emoji.includes(query)
    )
  }

  return icons
})

// 显示的图标（折叠时只显示16个）
const displayedIcons = computed(() => {
  // 搜索时自动展开全部
  if (searchQuery.value) {
    return filteredIcons.value
  }
  // 折叠状态下只显示前16个
  if (!isExpanded.value) {
    return filteredIcons.value.slice(0, 16)
  }
  return filteredIcons.value
})

const selectIcon = (icon) => {
  emit('update:modelValue', icon)
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.search-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-secondary);
  padding-bottom: var(--spacing-sm);
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.categories-tabs {
  display: flex;
  gap: var(--spacing-xs);
  overflow-x: auto;
  padding-bottom: var(--spacing-xs);
  -webkit-overflow-scrolling: touch;
}

.categories-tabs::-webkit-scrollbar {
  height: 4px;
}

.categories-tabs::-webkit-scrollbar-thumb {
  background: var(--separator);
  border-radius: 2px;
}

.tab {
  flex-shrink: 0;
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  background: var(--bg-tertiary);
  border-color: var(--text-tertiary);
}

.tab.active {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: var(--spacing-sm);
  overflow-y: auto;
  padding-bottom: var(--spacing-lg);
}

.icon-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 2px solid var(--separator);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--text-tertiary);
  transform: scale(1.05);
}

.icon-item.selected {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
}

.expand-section {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--separator);
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--separator);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.expand-icon {
  font-size: 12px;
  transition: transform 0.2s;
}
</style>