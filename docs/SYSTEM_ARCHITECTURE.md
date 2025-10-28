# RFQ询价管理系统 - 系统架构文档

## 1. 系统概述

RFQ询价管理系统是一个完整的B2B询价报价管理平台，支持产品询价、供应商报价、运费计算等核心业务流程。

### 1.1 核心功能
- **询价单管理**: 创建、编辑、查看RFQ询价单
- **供应商报价**: 管理供应商信息和报价数据
- **运费计算**: 智能运费估算和物流方案比较
- **分类管理**: 三级产品分类体系
- **属性配置**: 动态属性和功能模块管理
- **权限控制**: 基于角色的访问控制(RBAC)

### 1.2 技术栈
- **前端**: React 18 + TypeScript + Vite
- **UI框架**: TailwindCSS + Shadcn/ui + Radix UI
- **状态管理**: React Query (TanStack Query)
- **路由**: React Router v6
- **后端**: Supabase (PostgreSQL + Row Level Security)
- **认证**: Supabase Auth
- **部署**: Lovable Cloud

## 2. 系统架构

### 2.1 整体架构图

<lov-mermaid>
graph TB
    subgraph "前端层 Frontend"
        A[React应用]
        B[路由管理]
        C[状态管理]
        D[UI组件]
    end
    
    subgraph "服务层 Service Layer"
        E[RFQ Service]
        F[Shipping Service]
        G[Category Service]
    end
    
    subgraph "数据层 Data Layer"
        H[Supabase Client]
        I[PostgreSQL]
        J[Row Level Security]
    end
    
    subgraph "认证层 Auth Layer"
        K[Supabase Auth]
        L[用户角色管理]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    B --> G
    E --> H
    F --> H
    G --> H
    H --> I
    I --> J
    K --> L
    L --> J
</lov-mermaid>

### 2.2 前端架构

<lov-mermaid>
graph LR
    subgraph "页面层 Pages"
        P1[首页]
        P2[新建询价单]
        P3[询价单列表]
        P4[报价请求管理]
        P5[运费计算器]
        P6[管理后台]
    end
    
    subgraph "组件层 Components"
        C1[RFQ组件]
        C2[Shipping组件]
        C3[Admin组件]
        C4[UI组件]
    end
    
    subgraph "业务逻辑层 Services"
        S1[rfqService]
        S2[shippingService]
        S3[categoryService]
    end
    
    P1 --> C4
    P2 --> C1
    P3 --> C1
    P4 --> C1
    P5 --> C2
    P6 --> C3
    
    C1 --> S1
    C2 --> S2
    C3 --> S1
    C3 --> S2
    C3 --> S3
</lov-mermaid>

### 2.3 数据流架构

<lov-mermaid>
sequenceDiagram
    participant U as 用户
    participant P as 页面组件
    participant S as Service层
    participant SB as Supabase Client
    participant DB as PostgreSQL
    
    U->>P: 用户操作
    P->>S: 调用业务方法
    S->>SB: 数据库查询
    SB->>DB: SQL执行
    DB-->>SB: 返回数据
    SB-->>S: 返回结果
    S-->>P: 处理后的数据
    P-->>U: 更新UI
</lov-mermaid>

## 3. 核心业务模块

### 3.1 询价单(RFQ)模块

#### 业务流程
<lov-mermaid>
graph TD
    A[创建询价单] --> B[选择产品分类]
    B --> C[填写基础信息]
    C --> D[配置产品属性]
    D --> E[选择功能模块]
    E --> F[填写商务条款]
    F --> G{是否包含运费?}
    G -->|是| H[计算运费方案]
    G -->|否| I[保存询价单]
    H --> I
    I --> J[提交审核]
    J --> K[供应商报价]
    K --> L[比较报价]
    L --> M[选择供应商]
</lov-mermaid>

#### 关键功能
- **三级分类选择**: 支持L1/L2/L3三级产品分类
- **动态属性表单**: 根据分类动态加载属性字段
- **功能模块组合**: 可选的产品功能模块(如认证、包装等)
- **多供应商比价**: 支持多个供应商同时报价
- **运费集成**: 可选的运费计算和方案对比

### 3.2 运费计算模块

#### 业务逻辑
<lov-mermaid>
graph LR
    A[输入参数] --> B{查询费率矩阵}
    B --> C[匹配仓库]
    C --> D[匹配渠道]
    D --> E[匹配重量区间]
    E --> F[匹配目的国]
    F --> G[计算基础运费]
    G --> H[计算燃油附加费]
    H --> I[计算偏远附加费]
    I --> J[应用最低收费]
    J --> K[返回报价]
</lov-mermaid>

#### 计算公式
```
基础运费 = 首重费用 + (额外重量步数 × 续重费用)
燃油附加费 = 基础运费 × 燃油附加费率
偏远附加费 = 固定金额
总运费 = MAX(基础运费 + 燃油附加费 + 偏远附加费, 最低收费)
```

### 3.3 分类属性管理模块

#### 分类体系
- **L1分类**: 一级大类(如电子产品、服装等)
- **L2分类**: 二级子类(如手机配件、男装等)
- **L3分类**: 三级细分(如充电器、T恤等)

#### 属性类型
- `text`: 单行文本
- `textarea`: 多行文本
- `number`: 数字
- `select`: 单选下拉
- `multiselect`: 多选
- `bool`: 布尔值
- `file`: 文件上传

### 3.4 权限控制模块

#### 角色定义
- **admin**: 系统管理员，完全访问权限
- **moderator**: 审核员，部分管理权限
- **user**: 普通用户，基础操作权限

#### 权限矩阵
| 功能 | admin | moderator | user |
|------|-------|-----------|------|
| 创建RFQ | ✓ | ✓ | ✓ |
| 查看自己的RFQ | ✓ | ✓ | ✓ |
| 查看所有RFQ | ✓ | ✓ | ✗ |
| 删除RFQ | ✓ | ✗ | ✗ |
| 管理分类 | ✓ | ✗ | ✗ |
| 管理属性 | ✓ | ✗ | ✗ |
| 管理运费 | ✓ | ✗ | ✗ |

## 4. 数据库设计

### 4.1 ER图

<lov-mermaid>
erDiagram
    users ||--o{ user_roles : has
    users ||--o{ rfqs : creates
    rfqs ||--o{ suppliers : contains
    rfqs ||--o{ rfq_shipping_quotes : has
    
    categories ||--o{ categories : "parent-child"
    categories ||--o{ category_attributes : defines
    categories ||--o{ category_feature_binding : supports
    
    feature_modules ||--o{ feature_attributes : contains
    feature_modules ||--o{ category_feature_binding : bound_to
    
    warehouses ||--o{ rate_matrix : from
    shipping_carriers ||--o{ shipping_channels : owns
    shipping_channels ||--o{ rate_matrix : uses
    shipping_channels ||--o{ rfq_shipping_quotes : quotes
    warehouses ||--o{ rfq_shipping_quotes : from
</lov-mermaid>

### 4.2 核心表结构详解

#### 4.2.1 用户相关表

##### user_roles (用户角色表)
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);
```

**字段说明**:
- `id`: 主键UUID
- `user_id`: 关联auth.users表的用户ID
- `role`: 角色枚举(admin/moderator/user)
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引**: 
- PRIMARY KEY: `id`
- UNIQUE: `(user_id, role)`

**RLS策略**:
- 用户可查看自己的角色
- 管理员可管理所有角色

---

#### 4.2.2 产品分类相关表

##### categories (产品分类表)
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name_cn TEXT NOT NULL,
    name_en TEXT NOT NULL,
    code TEXT,
    parent_id INTEGER,
    level INTEGER NOT NULL,
    path TEXT,
    sort INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**字段说明**:
- `id`: 分类ID(整数)
- `name_cn`: 中文名称
- `name_en`: 英文名称
- `code`: 分类编码
- `parent_id`: 父分类ID(NULL表示一级分类)
- `level`: 分类层级(1/2/3)
- `path`: 分类路径(如: "1/12/123")
- `sort`: 排序号

**业务规则**:
- level=1: 一级分类，parent_id=NULL
- level=2: 二级分类，parent_id为L1分类ID
- level=3: 三级分类，parent_id为L2分类ID
- path记录完整层级路径，便于查询

##### category_attributes (分类属性表)
```sql
CREATE TABLE category_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INTEGER NOT NULL,
    attr_code TEXT NOT NULL,
    attr_name TEXT NOT NULL,
    input_type TEXT NOT NULL,
    required INTEGER DEFAULT 0,
    unit TEXT,
    options_json JSONB DEFAULT '[]',
    help_text TEXT,
    visible_on_quote INTEGER DEFAULT 1,
    attr_sort INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**字段说明**:
- `category_id`: 关联的L3分类ID
- `attr_code`: 属性代码(唯一标识)
- `attr_name`: 属性名称
- `input_type`: 输入类型(text/number/select/multiselect/bool/file/textarea)
- `required`: 是否必填(0=否, 1=是)
- `unit`: 单位(如: cm, kg, 个)
- `options_json`: 选项列表(用于select/multiselect类型)
- `help_text`: 帮助文本
- `visible_on_quote`: 是否在报价时显示(0=否, 1=是)
- `attr_sort`: 排序号

**选项JSON格式**:
```json
["选项1", "选项2", "选项3"]
```

---

#### 4.2.3 功能模块相关表

##### feature_modules (功能模块表)
```sql
CREATE TABLE feature_modules (
    feature_code TEXT PRIMARY KEY,
    feature_name TEXT NOT NULL,
    feature_name_en TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**字段说明**:
- `feature_code`: 功能模块代码(主键)
- `feature_name`: 中文名称
- `feature_name_en`: 英文名称
- `description`: 描述

**常见功能模块示例**:
- `certification`: 认证(如CE、FCC、RoHS)
- `packaging`: 包装
- `customization`: 定制
- `warranty`: 保修

##### feature_attributes (功能属性表)
```sql
CREATE TABLE feature_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_code TEXT NOT NULL,
    attr_code TEXT NOT NULL,
    attr_name TEXT NOT NULL,
    input_type TEXT NOT NULL,
    required INTEGER DEFAULT 0,
    unit TEXT,
    options_json JSONB DEFAULT '[]',
    help_text TEXT,
    visible_on_quote INTEGER DEFAULT 1,
    attr_sort INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**字段说明**: 同category_attributes，但关联到feature_code

##### category_feature_binding (分类功能绑定表)
```sql
CREATE TABLE category_feature_binding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INTEGER NOT NULL,
    feature_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category_id, feature_code)
);
```

**字段说明**:
- `category_id`: L3分类ID
- `feature_code`: 功能模块代码
- 表示某个分类支持哪些功能模块

---

#### 4.2.4 询价单相关表

##### rfqs (询价单主表)
```sql
CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    reference_number TEXT,
    product_name TEXT,
    
    -- 分类
    category_l1 INTEGER,
    category_l2 INTEGER,
    category_l3 INTEGER,
    
    -- 链接和媒体
    source_links TEXT[] DEFAULT '{}',
    customer_links TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    
    -- 目标参数
    target_country TEXT NOT NULL,
    currency TEXT NOT NULL,
    target_weight_kg NUMERIC,
    target_price NUMERIC,
    
    -- 属性和功能
    attributes JSONB DEFAULT '{}',
    feature_modules TEXT[] DEFAULT '{}',
    feature_attributes JSONB DEFAULT '{}',
    commercial_terms JSONB DEFAULT '{}',
    
    -- 运费相关
    include_shipping BOOLEAN NOT NULL DEFAULT false,
    default_warehouse_id UUID,
    
    -- 状态和备注
    status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**字段说明**:
- `inquiry_id`: 询价单编号(格式: RFQ-YYYYMMDD-XXXX)
- `user_id`: 创建用户ID
- `title`: 询价标题
- `reference_number`: 客户参考号
- `product_name`: 产品名称
- `category_l1/l2/l3`: 三级分类ID
- `source_links`: 参考链接数组
- `customer_links`: 客户提供链接数组
- `images`: 图片URL数组
- `attachments`: 附件URL数组
- `target_country`: 目标国家
- `currency`: 币种(USD/CNY/EUR等)
- `target_weight_kg`: 目标重量
- `target_price`: 目标价格
- `attributes`: 产品属性JSON对象
- `feature_modules`: 选择的功能模块代码数组
- `feature_attributes`: 功能属性JSON对象
- `commercial_terms`: 商务条款JSON对象
- `include_shipping`: 是否包含运费计算
- `default_warehouse_id`: 默认发货仓库
- `status`: 状态(draft/submitted/approved/rejected)
- `notes`: 备注

**属性JSON格式示例**:
```json
{
  "material": "塑料",
  "color": "黑色",
  "size": "10x20x30",
  "weight": "500g"
}
```

**功能属性JSON格式示例**:
```json
{
  "certification": {
    "cert_type": "CE",
    "cert_number": "CE-12345"
  },
  "packaging": {
    "box_type": "彩盒",
    "box_material": "纸板"
  }
}
```

##### suppliers (供应商报价表)
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID REFERENCES rfqs(id),
    supplier_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    
    -- 联系信息
    province TEXT,
    city TEXT,
    address TEXT,
    contact TEXT,
    phone TEXT,
    wechat TEXT,
    email TEXT,
    
    -- 1688信息
    link_1688 TEXT,
    rating_1688 NUMERIC,
    
    -- 标签和评分
    tags TEXT[] DEFAULT '{}',
    rating NUMERIC,
    
    -- 报价数据
    quotes JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**字段说明**:
- `rfq_id`: 关联的询价单ID
- `supplier_id`: 供应商ID
- `name`: 供应商名称
- `quotes`: 报价数组(JSONB格式)

**报价JSON格式示例**:
```json
[
  {
    "quote_id": "Q-001",
    "currency": "CNY",
    "moq": 1000,
    "unit_price_exw": 15.5,
    "tax_included": 1,
    "lead_time_days": 30,
    "weight_kg": 0.5,
    "length_cm": 10,
    "width_cm": 20,
    "height_cm": 30,
    "inner_pack": "OPP袋",
    "outer_pack": "纸箱",
    "carton_qty": 50,
    "incoterm_supplier": "EXW",
    "valid_until": "2025-12-31",
    "remarks": "可定制",
    "attachments": ["url1", "url2"],
    "commercial_terms": {
      "payment_terms": "30% T/T预付"
    },
    "supplier_attributes": {
      "material": "ABS塑料"
    }
  }
]
```

---

#### 4.2.5 运费相关表

##### warehouses (仓库表)
```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_code TEXT NOT NULL UNIQUE,
    name_cn TEXT NOT NULL,
    name_en TEXT NOT NULL,
    country TEXT NOT NULL,
    province TEXT,
    city TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**字段说明**:
- `warehouse_code`: 仓库编码(唯一)
- `name_cn`: 中文名称
- `name_en`: 英文名称
- `country`: 国家代码
- `is_active`: 是否启用
- `sort`: 排序号

##### shipping_carriers (承运商表)
```sql
CREATE TABLE shipping_carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_code TEXT NOT NULL UNIQUE,
    carrier_name_cn TEXT NOT NULL,
    carrier_name_en TEXT NOT NULL,
    carrier_type TEXT NOT NULL DEFAULT 'express',
    website TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**字段说明**:
- `carrier_code`: 承运商编码
- `carrier_type`: 承运商类型(express/air/sea)
- `website`: 官网

##### shipping_channels (物流渠道表)
```sql
CREATE TABLE shipping_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID NOT NULL REFERENCES shipping_carriers(id),
    channel_code TEXT NOT NULL,
    channel_name_cn TEXT NOT NULL,
    channel_name_en TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(carrier_id, channel_code)
);
```

**字段说明**:
- `carrier_id`: 关联承运商ID
- `channel_code`: 渠道编码
- `description`: 渠道描述

**常见渠道示例**:
- DHL Express: 标准快递服务
- DHL Economy: 经济快递服务
- FedEx Priority: 优先服务
- FedEx Economy: 经济服务

##### rate_matrix (费率矩阵表)
```sql
CREATE TABLE rate_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    channel_id UUID NOT NULL REFERENCES shipping_channels(id),
    destination_country TEXT NOT NULL,
    
    -- 重量范围
    weight_min_kg NUMERIC NOT NULL,
    weight_max_kg NUMERIC NOT NULL,
    
    -- 首重和续重
    first_weight_kg NUMERIC NOT NULL,
    first_weight_fee NUMERIC NOT NULL,
    additional_weight_step_kg NUMERIC NOT NULL,
    additional_fee_per_step NUMERIC NOT NULL,
    
    -- 附加费用
    fuel_surcharge_percent NUMERIC NOT NULL DEFAULT 0,
    remote_area_surcharge NUMERIC NOT NULL DEFAULT 0,
    min_charge NUMERIC NOT NULL DEFAULT 0,
    
    -- 时效
    estimated_delivery_days_min INTEGER NOT NULL,
    estimated_delivery_days_max INTEGER NOT NULL,
    
    -- 生效期
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**字段说明**:
- `warehouse_id`: 发货仓库ID
- `channel_id`: 物流渠道ID
- `destination_country`: 目的国家代码
- `weight_min_kg`: 最小重量(kg)
- `weight_max_kg`: 最大重量(kg)
- `first_weight_kg`: 首重(kg)
- `first_weight_fee`: 首重费用
- `additional_weight_step_kg`: 续重步长(kg)
- `additional_fee_per_step`: 每续重步长费用
- `fuel_surcharge_percent`: 燃油附加费率(%)
- `remote_area_surcharge`: 偏远地区附加费
- `min_charge`: 最低收费
- `estimated_delivery_days_min/max`: 时效范围(天)
- `effective_from/until`: 生效期

**费率配置示例**:
```
仓库: 中国深圳
渠道: DHL Express
目的地: 美国
重量范围: 0-5kg
首重: 0.5kg @ $30
续重: 每0.5kg @ $5
燃油附加费: 15%
偏远附加费: $10
最低收费: $50
时效: 3-5天
```

**计算示例** (3kg货物):
```
首重费: $30 (0.5kg)
额外重量: 3 - 0.5 = 2.5kg
续重步数: 2.5 / 0.5 = 5步
续重费: 5 × $5 = $25
基础运费: $30 + $25 = $55
燃油附加费: $55 × 15% = $8.25
偏远附加费: $10
小计: $55 + $8.25 + $10 = $73.25
最低收费检查: $73.25 > $50 ✓
最终运费: $73.25
```

##### rfq_shipping_quotes (询价单运费报价表)
```sql
CREATE TABLE rfq_shipping_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    channel_id UUID NOT NULL REFERENCES shipping_channels(id),
    destination_country TEXT NOT NULL,
    
    -- 计算参数
    product_weight_kg NUMERIC NOT NULL,
    
    -- 费用明细
    base_freight NUMERIC NOT NULL,
    fuel_surcharge NUMERIC NOT NULL,
    remote_surcharge NUMERIC NOT NULL DEFAULT 0,
    total_freight NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- 时效
    estimated_delivery_days_min INTEGER NOT NULL,
    estimated_delivery_days_max INTEGER NOT NULL,
    
    -- 计算详情
    calculation_details JSONB,
    
    -- 状态
    is_selected BOOLEAN NOT NULL DEFAULT false,
    is_manual BOOLEAN NOT NULL DEFAULT false,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**字段说明**:
- `rfq_id`: 关联的询价单ID
- `warehouse_id`: 发货仓库ID
- `channel_id`: 物流渠道ID
- `destination_country`: 目的国家
- `product_weight_kg`: 产品重量
- `base_freight`: 基础运费
- `fuel_surcharge`: 燃油附加费
- `remote_surcharge`: 偏远附加费
- `total_freight`: 总运费
- `is_selected`: 是否被选中
- `is_manual`: 是否手动录入
- `calculation_details`: 计算明细(JSONB)

**计算明细JSON格式**:
```json
{
  "weight_kg": 3,
  "first_weight_kg": 0.5,
  "first_weight_fee": 30,
  "additional_weight_kg": 2.5,
  "additional_steps": 5,
  "additional_weight_step_kg": 0.5,
  "additional_fee_per_step": 5,
  "additional_fees": 25,
  "base_freight": 55,
  "fuel_surcharge_percent": 15,
  "fuel_surcharge": 8.25,
  "remote_surcharge": 10,
  "subtotal": 73.25,
  "min_charge": 50,
  "total_freight": 73.25,
  "currency": "USD"
}
```

---

#### 4.2.6 商务条款表

##### commercial_terms (商务条款表)
```sql
CREATE TABLE commercial_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attr_code TEXT NOT NULL UNIQUE,
    attr_name TEXT NOT NULL,
    input_type TEXT NOT NULL,
    required INTEGER DEFAULT 0,
    unit TEXT,
    options_json JSONB DEFAULT '[]',
    help_text TEXT,
    visible_on_quote INTEGER DEFAULT 1,
    attr_sort INTEGER DEFAULT 0,
    has_refundable_checkbox BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**字段说明**:
- `attr_code`: 条款代码
- `attr_name`: 条款名称
- `has_refundable_checkbox`: 是否有可退款复选框(用于某些费用项)

**常见商务条款**:
- `payment_terms`: 付款条款
- `delivery_terms`: 交货条款
- `warranty`: 质保期
- `moq`: 最小起订量
- `lead_time`: 交货期
- `sample_policy`: 样品政策

---

### 4.3 索引策略

#### 高频查询索引
```sql
-- RFQ查询索引
CREATE INDEX idx_rfqs_user_id ON rfqs(user_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_inquiry_id ON rfqs(inquiry_id);

-- 分类查询索引
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_category_attributes_category_id ON category_attributes(category_id);

-- 运费查询索引
CREATE INDEX idx_rate_matrix_warehouse_channel ON rate_matrix(warehouse_id, channel_id);
CREATE INDEX idx_rate_matrix_destination ON rate_matrix(destination_country);
CREATE INDEX idx_rate_matrix_weight ON rate_matrix(weight_min_kg, weight_max_kg);
CREATE INDEX idx_rfq_shipping_quotes_rfq_id ON rfq_shipping_quotes(rfq_id);

-- 供应商查询索引
CREATE INDEX idx_suppliers_rfq_id ON suppliers(rfq_id);
```

### 4.4 RLS安全策略

#### 用户数据隔离
```sql
-- RFQ表: 用户只能访问自己的询价单
CREATE POLICY "Users can view their own RFQs"
ON rfqs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own RFQs"
ON rfqs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RFQs"
ON rfqs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RFQs"
ON rfqs FOR DELETE
USING (auth.uid() = user_id);
```

#### 管理员全局权限
```sql
-- 管理员可以管理所有分类
CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 管理员可以管理运费配置
CREATE POLICY "Admins can manage rate matrix"
ON rate_matrix FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

#### 公开数据读取
```sql
-- 所有认证用户都可以读取基础配置
CREATE POLICY "Anyone can read categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Anyone can read warehouses"
ON warehouses FOR SELECT
USING (true);

CREATE POLICY "Anyone can read carriers"
ON shipping_carriers FOR SELECT
USING (true);
```

## 5. API接口设计

### 5.1 RFQ相关接口

#### 创建/更新询价单
```typescript
rfqService.saveRFQ(data: RFQData): Promise<{ ok: boolean; id: string }>
```

#### 获取询价单
```typescript
rfqService.getRFQById(id: string): Promise<RFQData | null>
rfqService.listRFQs(): Promise<RFQData[]>
```

#### 删除询价单
```typescript
rfqService.deleteRFQs(inquiryIds: string[]): Promise<{ ok: boolean }>
```

### 5.2 分类相关接口

#### 获取分类树
```typescript
rfqService.getCategoryTree(): Promise<Category[]>
```

#### 获取分类属性
```typescript
rfqService.getCategoryAttributes(l3Id: number): Promise<CategoryAttribute[]>
```

#### 获取功能模块
```typescript
rfqService.getAvailableFeatureModules(l3Id: number): Promise<FeatureModule[]>
rfqService.getFeatureAttributes(featureCode: string): Promise<FeatureModuleAttribute[]>
```

### 5.3 运费相关接口

#### 计算运费
```typescript
shippingService.calculateShippingQuote(
  weight: number,
  warehouseId: string,
  channelId: string,
  destination: string
): Promise<ShippingEstimateResult | null>

shippingService.calculateMultipleQuotes(
  weight: number,
  warehouseId: string,
  destination: string
): Promise<ShippingEstimateResult[]>
```

#### 保存运费报价
```typescript
shippingService.saveShippingQuote(
  rfqId: string,
  quote: Omit<RFQShippingQuote, 'id' | 'rfq_id' | 'created_at' | 'updated_at'>
): Promise<RFQShippingQuote>
```

#### 获取运费报价
```typescript
shippingService.getShippingQuotesForRFQ(rfqId: string): Promise<RFQShippingQuote[]>
```

## 6. 安全设计

### 6.1 认证机制
- Supabase Auth提供JWT令牌认证
- 自动刷新令牌机制
- 会话管理

### 6.2 授权机制
- 基于角色的访问控制(RBAC)
- Row Level Security(RLS)策略
- 用户只能访问自己创建的数据
- 管理员拥有全局访问权限

### 6.3 数据验证
- 前端表单验证(React Hook Form + Zod)
- 后端数据库约束(NOT NULL, UNIQUE, CHECK)
- RLS策略确保数据隔离

### 6.4 SQL注入防护
- 使用参数化查询
- Supabase客户端自动处理SQL转义

## 7. 性能优化

### 7.1 数据库优化
- 合理的索引设计
- JSONB字段用于灵活数据存储
- 分页查询大数据集
- 使用数组类型减少关联查询

### 7.2 前端优化
- React Query缓存策略
- 懒加载组件
- 虚拟滚动大列表
- 图片懒加载

### 7.3 查询优化
- 使用JOIN减少查询次数
- 批量操作减少网络往返
- 预加载关联数据

## 8. 部署架构

### 8.1 环境配置
- **开发环境**: 本地Vite开发服务器 + Supabase测试项目
- **生产环境**: Lovable Cloud部署 + Supabase生产项目

### 8.2 CI/CD流程
- 代码提交到Git仓库
- Lovable自动构建和部署
- 数据库迁移自动应用

### 8.3 监控告警
- Supabase内置监控面板
- 查询性能分析
- 错误日志追踪

## 9. 扩展性设计

### 9.1 多租户支持
- 当前设计已支持多用户数据隔离
- 可扩展为多租户架构(添加tenant_id)

### 9.2 国际化
- 数据库存储中英文字段(name_cn, name_en)
- 前端可扩展i18n支持

### 9.3 API集成
- 预留与1688、Amazon等平台对接接口
- 支持Webhook通知机制

### 9.4 移动端适配
- 响应式设计
- 可扩展为PWA
- 可开发独立移动应用

## 10. 数据字典

### 10.1 枚举值定义

#### app_role (用户角色)
- `admin`: 管理员
- `moderator`: 审核员
- `user`: 普通用户

#### rfq_status (询价单状态)
- `draft`: 草稿
- `submitted`: 已提交
- `approved`: 已批准
- `rejected`: 已拒绝

#### input_type (输入类型)
- `text`: 单行文本
- `textarea`: 多行文本
- `number`: 数字
- `select`: 单选下拉
- `multiselect`: 多选
- `bool`: 布尔值
- `file`: 文件上传

#### carrier_type (承运商类型)
- `express`: 快递
- `air`: 空运
- `sea`: 海运

#### currency (币种)
- `CNY`: 人民币
- `USD`: 美元
- `EUR`: 欧元
- `GBP`: 英镑
- `JPY`: 日元

### 10.2 国家代码
使用ISO 3166-1 alpha-2标准:
- `CN`: 中国
- `US`: 美国
- `GB`: 英国
- `DE`: 德国
- `JP`: 日本
- `AU`: 澳大利亚
- ... (更多国家)

## 11. 常见业务场景

### 11.1 创建询价单流程
1. 用户登录系统
2. 选择产品分类(L1 → L2 → L3)
3. 系统加载对应的分类属性
4. 用户填写产品基本信息
5. 选择可选的功能模块
6. 填写功能模块属性
7. 填写商务条款
8. 如果需要运费，选择仓库和计算运费
9. 保存询价单(草稿或提交)

### 11.2 供应商报价流程
1. 查看询价单详情
2. 添加供应商信息
3. 填写报价单:
   - 价格条款(MOQ, 单价, 含税)
   - 产品规格(继承或修改客户规格)
   - 包装信息
   - 交货期
   - 商务条款
4. 上传报价附件
5. 保存报价
6. 比较多个供应商报价

### 11.3 运费计算流程
1. 输入产品重量
2. 选择发货仓库
3. 系统查询该仓库到目标国家的所有可用渠道
4. 对每个渠道:
   - 查询费率矩阵
   - 匹配重量区间
   - 计算基础运费
   - 计算附加费用
5. 返回多个运费方案供选择
6. 用户选择最优方案
7. 运费报价关联到询价单

## 12. 故障排查指南

### 12.1 常见问题

#### 问题1: 无法加载分类属性
**原因**: L3分类ID不正确或数据库无对应属性
**解决**: 检查category_attributes表，确认category_id存在且有数据

#### 问题2: 运费计算返回空
**原因**: 
- 费率矩阵未配置
- 重量超出范围
- 渠道未启用
**解决**: 检查rate_matrix表，确认配置完整且is_active=true

#### 问题3: RLS权限错误
**原因**: 
- 用户未登录
- 尝试访问其他用户数据
- 角色权限不足
**解决**: 
- 确认auth.uid()有值
- 检查RLS策略
- 验证user_roles表

#### 问题4: JSONB字段查询慢
**原因**: JSONB字段未建索引
**解决**: 
```sql
CREATE INDEX idx_rfqs_attributes ON rfqs USING GIN(attributes);
CREATE INDEX idx_suppliers_quotes ON suppliers USING GIN(quotes);
```

### 12.2 性能监控

#### 慢查询识别
```sql
-- 查询执行时间超过1秒的查询
SELECT query, total_time, calls, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY total_time DESC
LIMIT 20;
```

#### 索引使用率
```sql
-- 查看未使用的索引
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

## 13. 未来优化方向

### 13.1 功能增强
- [ ] 询价单审批工作流
- [ ] 供应商自助报价Portal
- [ ] 智能报价推荐算法
- [ ] 价格趋势分析
- [ ] 批量导入/导出功能
- [ ] 移动APP

### 13.2 性能优化
- [ ] Redis缓存层
- [ ] CDN静态资源加速
- [ ] 数据库读写分离
- [ ] 全文搜索引擎(Elasticsearch)

### 13.3 集成扩展
- [ ] 1688平台对接
- [ ] ERP系统对接
- [ ] 财务系统集成
- [ ] 物流跟踪API
- [ ] 邮件/短信通知

---

**文档版本**: v1.0  
**最后更新**: 2025-01-28  
**维护者**: 开发团队
