export interface Report {
  id?: number
  date: string
  content: string
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  created_at?: string
  updated_at?: string
}

// 生成日期的辅助函数
function getDateString(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

// Mock 数据存储
let mockReports: Report[] = [
  {
    id: 1,
    date: getDateString(0),
    content: '<h1>今日工作</h1><p>完成了项目的前端开发工作，优化了用户界面交互体验。修复了几个关键 bug，提升了应用性能。</p>',
    type: 'daily',
    created_at: `${getDateString(0)}T10:00:00`,
    updated_at: `${getDateString(0)}T10:00:00`,
  },
  {
    id: 2,
    date: getDateString(1),
    content: '<h1>昨日工作</h1><p>进行了代码重构，改进了数据层架构。与团队成员讨论了下一阶段的开发计划。</p>',
    type: 'daily',
    created_at: `${getDateString(1)}T10:00:00`,
    updated_at: `${getDateString(1)}T10:00:00`,
  },
  {
    id: 3,
    date: getDateString(2),
    content: '<h1>工作日志</h1><p>完成了新功能的开发，编写了单元测试。参加了项目评审会议。</p>',
    type: 'daily',
    created_at: `${getDateString(2)}T10:00:00`,
    updated_at: `${getDateString(2)}T10:00:00`,
  },
  {
    id: 4,
    date: getDateString(3),
    content: '<h1>开发进展</h1><p>优化了数据库查询性能，减少了响应时间。解决了用户反馈的几个问题。</p>',
    type: 'daily',
    created_at: `${getDateString(3)}T10:00:00`,
    updated_at: `${getDateString(3)}T10:00:00`,
  },
  {
    id: 5,
    date: getDateString(4),
    content: '<h1>今日总结</h1><p>完成了 API 接口的开发，更新了技术文档。与设计团队协调了 UI 改进方案。</p>',
    type: 'daily',
    created_at: `${getDateString(4)}T10:00:00`,
    updated_at: `${getDateString(4)}T10:00:00`,
  },
  {
    id: 6,
    date: getDateString(5),
    content: '<h1>工作记录</h1><p>进行了系统性能测试，发现并修复了一些潜在问题。更新了部署流程。</p>',
    type: 'daily',
    created_at: `${getDateString(5)}T10:00:00`,
    updated_at: `${getDateString(5)}T10:00:00`,
  },
  {
    id: 7,
    date: getDateString(6),
    content: '<h1>本周总结</h1><p>本周完成了多个重要功能模块的开发，包括用户认证、数据管理和报表生成。团队协作良好，项目进展顺利。下周计划开始新功能的开发工作。</p>',
    type: 'weekly',
    created_at: `${getDateString(6)}T10:00:00`,
    updated_at: `${getDateString(6)}T10:00:00`,
  },
  {
    id: 8,
    date: getDateString(7),
    content: '<h1>工作日志</h1><p>完成了用户界面的优化工作，提升了用户体验。与产品经理讨论了新需求。</p>',
    type: 'daily',
    created_at: `${getDateString(7)}T10:00:00`,
    updated_at: `${getDateString(7)}T10:00:00`,
  },
  {
    id: 9,
    date: getDateString(8),
    content: '<h1>开发进展</h1><p>修复了多个 bug，改进了错误处理机制。编写了技术文档。</p>',
    type: 'daily',
    created_at: `${getDateString(8)}T10:00:00`,
    updated_at: `${getDateString(8)}T10:00:00`,
  },
  {
    id: 10,
    date: getDateString(9),
    content: '<h1>今日工作</h1><p>完成了数据库迁移工作，确保了数据的一致性。进行了代码审查。</p>',
    type: 'daily',
    created_at: `${getDateString(9)}T10:00:00`,
    updated_at: `${getDateString(9)}T10:00:00`,
  },
  {
    id: 11,
    date: getDateString(10),
    content: '<h1>工作记录</h1><p>优化了应用启动速度，减少了加载时间。更新了开发环境配置。</p>',
    type: 'daily',
    created_at: `${getDateString(10)}T10:00:00`,
    updated_at: `${getDateString(10)}T10:00:00`,
  },
  {
    id: 12,
    date: getDateString(11),
    content: '<h1>开发日志</h1><p>实现了新的业务逻辑，增加了系统功能。与测试团队协作完成了测试用例的编写。</p>',
    type: 'daily',
    created_at: `${getDateString(11)}T10:00:00`,
    updated_at: `${getDateString(11)}T10:00:00`,
  },
  {
    id: 13,
    date: getDateString(12),
    content: '<h1>今日总结</h1><p>完成了安全加固工作，修复了安全漏洞。更新了依赖包版本。</p>',
    type: 'daily',
    created_at: `${getDateString(12)}T10:00:00`,
    updated_at: `${getDateString(12)}T10:00:00`,
  },
  {
    id: 14,
    date: getDateString(13),
    content: '<h1>工作进展</h1><p>进行了代码重构，提高了代码质量。参加了技术分享会议。</p>',
    type: 'daily',
    created_at: `${getDateString(13)}T10:00:00`,
    updated_at: `${getDateString(13)}T10:00:00`,
  },
  {
    id: 15,
    date: getDateString(14),
    content: '<h1>本周总结</h1><p>本周重点完成了系统优化工作，提升了整体性能。发布了新版本，用户反馈良好。下周将继续优化工作，并开始新功能的规划。</p>',
    type: 'weekly',
    created_at: `${getDateString(14)}T10:00:00`,
    updated_at: `${getDateString(14)}T10:00:00`,
  },
  {
    id: 16,
    date: getDateString(20),
    content: '<h1>本月总结</h1><p>这个月项目进展顺利，完成了多个重要里程碑。团队协作良好，代码质量持续提升。发布了两个重要版本，用户满意度高。下月将继续推进项目进度。</p>',
    type: 'monthly',
    created_at: `${getDateString(20)}T10:00:00`,
    updated_at: `${getDateString(20)}T10:00:00`,
  },
  {
    id: 17,
    date: getDateString(15),
    content: '<h1>工作日志</h1><p>完成了新模块的开发，增加了系统功能。与客户沟通了需求变更。</p>',
    type: 'daily',
    created_at: `${getDateString(15)}T10:00:00`,
    updated_at: `${getDateString(15)}T10:00:00`,
  },
  {
    id: 18,
    date: getDateString(16),
    content: '<h1>开发进展</h1><p>优化了算法性能，提升了处理速度。修复了用户报告的问题。</p>',
    type: 'daily',
    created_at: `${getDateString(16)}T10:00:00`,
    updated_at: `${getDateString(16)}T10:00:00`,
  },
  {
    id: 19,
    date: getDateString(17),
    content: '<h1>今日工作</h1><p>完成了集成测试，确保了系统的稳定性。更新了部署脚本。</p>',
    type: 'daily',
    created_at: `${getDateString(17)}T10:00:00`,
    updated_at: `${getDateString(17)}T10:00:00`,
  },
  {
    id: 20,
    date: getDateString(18),
    content: '<h1>工作记录</h1><p>进行了性能调优，减少了资源消耗。改进了错误日志记录机制。</p>',
    type: 'daily',
    created_at: `${getDateString(18)}T10:00:00`,
    updated_at: `${getDateString(18)}T10:00:00`,
  },
  {
    id: 21,
    date: getDateString(19),
    content: '<h1>开发日志</h1><p>实现了缓存机制，提升了响应速度。与运维团队协调了服务器配置。</p>',
    type: 'daily',
    created_at: `${getDateString(19)}T10:00:00`,
    updated_at: `${getDateString(19)}T10:00:00`,
  },
  {
    id: 22,
    date: getDateString(21),
    content: '<h1>本周总结</h1><p>本周主要完成了系统维护和优化工作。解决了几个重要的技术问题，提升了系统稳定性。团队配合默契，工作高效。</p>',
    type: 'weekly',
    created_at: `${getDateString(21)}T10:00:00`,
    updated_at: `${getDateString(21)}T10:00:00`,
  },
  {
    id: 23,
    date: getDateString(25),
    content: '<h1>工作日志</h1><p>完成了用户反馈功能的开发，提升了用户满意度。进行了代码审查和优化。</p>',
    type: 'daily',
    created_at: `${getDateString(25)}T10:00:00`,
    updated_at: `${getDateString(25)}T10:00:00`,
  },
  {
    id: 24,
    date: getDateString(26),
    content: '<h1>开发进展</h1><p>实现了数据导出功能，方便用户使用。优化了界面交互体验。</p>',
    type: 'daily',
    created_at: `${getDateString(26)}T10:00:00`,
    updated_at: `${getDateString(26)}T10:00:00`,
  },
  {
    id: 25,
    date: getDateString(27),
    content: '<h1>今日总结</h1><p>完成了移动端适配工作，提升了跨平台兼容性。修复了多个平台相关的 bug。</p>',
    type: 'daily',
    created_at: `${getDateString(27)}T10:00:00`,
    updated_at: `${getDateString(27)}T10:00:00`,
  },
  {
    id: 26,
    date: getDateString(28),
    content: '<h1>工作记录</h1><p>进行了代码质量检查，提高了代码规范性。更新了开发规范文档。</p>',
    type: 'daily',
    created_at: `${getDateString(28)}T10:00:00`,
    updated_at: `${getDateString(28)}T10:00:00`,
  },
  {
    id: 27,
    date: getDateString(30),
    content: '<h1>本周总结</h1><p>本周完成了多个新功能的开发，系统功能更加完善。团队进行了技术培训，提升了整体技能水平。项目进度符合预期。</p>',
    type: 'weekly',
    created_at: `${getDateString(30)}T10:00:00`,
    updated_at: `${getDateString(30)}T10:00:00`,
  },
  {
    id: 28,
    date: getDateString(35),
    content: '<h1>工作日志</h1><p>完成了数据可视化功能的开发，提供了更好的数据分析能力。优化了图表渲染性能。</p>',
    type: 'daily',
    created_at: `${getDateString(35)}T10:00:00`,
    updated_at: `${getDateString(35)}T10:00:00`,
  },
  {
    id: 29,
    date: getDateString(40),
    content: '<h1>开发进展</h1><p>实现了多语言支持功能，提升了国际化能力。与翻译团队协作完成了内容翻译。</p>',
    type: 'daily',
    created_at: `${getDateString(40)}T10:00:00`,
    updated_at: `${getDateString(40)}T10:00:00`,
  },
  {
    id: 30,
    date: getDateString(45),
    content: '<h1>本月总结</h1><p>本月项目取得了重要进展，完成了多个关键功能。团队规模扩大，工作效率提升。用户数量持续增长，反馈积极。下月将继续推进项目，完善功能细节。</p>',
    type: 'monthly',
    created_at: `${getDateString(45)}T10:00:00`,
    updated_at: `${getDateString(45)}T10:00:00`,
  },
  {
    id: 31,
    date: getDateString(50),
    content: '<h1>本周总结</h1><p>本周重点完成了系统架构优化，提升了可扩展性。引入了新技术栈，改善了开发体验。团队协作更加顺畅。</p>',
    type: 'weekly',
    created_at: `${getDateString(50)}T10:00:00`,
    updated_at: `${getDateString(50)}T10:00:00`,
  },
  {
    id: 32,
    date: getDateString(60),
    content: '<h1>工作日志</h1><p>完成了自动化测试框架的搭建，提升了测试效率。编写了测试用例文档。</p>',
    type: 'daily',
    created_at: `${getDateString(60)}T10:00:00`,
    updated_at: `${getDateString(60)}T10:00:00`,
  },
  {
    id: 33,
    date: getDateString(90),
    content: '<h1>本季度总结</h1><p>本季度项目取得了显著进展，完成了多个重要里程碑。团队能力不断提升，项目质量持续改善。发布了多个重要版本，用户满意度高。下季度将继续推进项目，实现更多目标。</p>',
    type: 'yearly',
    created_at: `${getDateString(90)}T10:00:00`,
    updated_at: `${getDateString(90)}T10:00:00`,
  },
  {
    id: 34,
    date: getDateString(100),
    content: '<h1>本月总结</h1><p>本月完成了大量开发工作，系统功能不断完善。团队合作默契，项目进度顺利。获得了客户的好评，市场反响良好。</p>',
    type: 'monthly',
    created_at: `${getDateString(100)}T10:00:00`,
    updated_at: `${getDateString(100)}T10:00:00`,
  },
  {
    id: 35,
    date: getDateString(120),
    content: '<h1>本周总结</h1><p>本周完成了性能优化工作，系统响应速度明显提升。解决了几个重要的技术难题，积累了宝贵经验。</p>',
    type: 'weekly',
    created_at: `${getDateString(120)}T10:00:00`,
    updated_at: `${getDateString(120)}T10:00:00`,
  },
]

let nextId = 36

// 模拟异步延迟
function delay(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getAllReports(): Promise<Report[]> {
  await delay()
  return [...mockReports].sort((a, b) => {
    if (!a.date || !b.date)
      return 0
    return b.date.localeCompare(a.date)
  })
}

export async function getReportById(id: number): Promise<Report | null> {
  await delay()
  return mockReports.find(report => report.id === id) || null
}

export async function createReport(report: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  await delay()
  const newReport: Report = {
    ...report,
    id: nextId++,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockReports.push(newReport)
  return newReport.id!
}

export async function updateReport(id: number, report: Partial<Omit<Report, 'id' | 'created_at'>>): Promise<void> {
  await delay()
  const index = mockReports.findIndex(r => r.id === id)
  if (index !== -1) {
    mockReports[index] = {
      ...mockReports[index],
      ...report,
      updated_at: new Date().toISOString(),
    }
  }
}

export async function deleteReport(id: number): Promise<void> {
  await delay()
  mockReports = mockReports.filter(report => report.id !== id)
}

export async function searchReports(query: string, type?: string): Promise<Report[]> {
  await delay()
  let results = mockReports.filter((report) => {
    const text = report.content.replace(/<[^>]*>/g, '').toLowerCase()
    return text.includes(query.toLowerCase())
  })

  if (type) {
    results = results.filter(report => report.type === type)
  }

  return results.sort((a, b) => {
    if (!a.date || !b.date)
      return 0
    return b.date.localeCompare(a.date)
  })
}

// 数据库条目类型
export interface DatabaseItem {
  id?: number
  source: 'git' | 'clickup' | 'slack' | 'gmail' | 'alimail'
  date: string
  content: string
  created_at?: string
  updated_at?: string
}

// Mock 数据库数据
const mockDatabaseItems: DatabaseItem[] = [
  {
    id: 1,
    source: 'git',
    date: getDateString(0),
    content: '修复了用户登录页面的验证逻辑问题，优化了错误提示信息',
    created_at: `${getDateString(0)}T09:00:00`,
    updated_at: `${getDateString(0)}T09:00:00`,
  },
  {
    id: 2,
    source: 'clickup',
    date: getDateString(0),
    content: '完成了新功能模块的设计评审，确定了技术实现方案',
    created_at: `${getDateString(0)}T10:30:00`,
    updated_at: `${getDateString(0)}T10:30:00`,
  },
  {
    id: 4,
    source: 'git',
    date: getDateString(1),
    content: '合并了 feature/user-profile 分支，添加了用户资料编辑功能',
    created_at: `${getDateString(1)}T14:20:00`,
    updated_at: `${getDateString(1)}T14:20:00`,
  },
  {
    id: 5,
    source: 'clickup',
    date: getDateString(1),
    content: '更新了项目进度，当前完成度 75%，预计下周完成剩余功能',
    created_at: `${getDateString(1)}T15:45:00`,
    updated_at: `${getDateString(1)}T15:45:00`,
  },
  {
    id: 6,
    source: 'slack',
    date: getDateString(1),
    content: '团队讨论了下个迭代的计划，确定了优先级和分工',
    created_at: `${getDateString(1)}T16:30:00`,
    updated_at: `${getDateString(1)}T16:30:00`,
  },
  {
    id: 8,
    source: 'git',
    date: getDateString(2),
    content: '重构了数据访问层，提升了代码可维护性和性能',
    created_at: `${getDateString(2)}T10:15:00`,
    updated_at: `${getDateString(2)}T10:15:00`,
  },
  {
    id: 10,
    source: 'clickup',
    date: getDateString(3),
    content: '完成了 API 文档的编写，已提交给前端团队进行对接',
    created_at: `${getDateString(3)}T13:20:00`,
    updated_at: `${getDateString(3)}T13:20:00`,
  },
  {
    id: 11,
    source: 'git',
    date: getDateString(3),
    content: '添加了单元测试，覆盖率达到 85%，提升了代码质量',
    created_at: `${getDateString(3)}T14:45:00`,
    updated_at: `${getDateString(3)}T14:45:00`,
  },
  {
    id: 13,
    source: 'slack',
    date: getDateString(4),
    content: '分享了新技术栈的学习心得，团队讨论热烈',
    created_at: `${getDateString(4)}T10:00:00`,
    updated_at: `${getDateString(4)}T10:00:00`,
  },
  {
    id: 14,
    source: 'git',
    date: getDateString(4),
    content: '优化了数据库查询，减少了响应时间，提升了用户体验',
    created_at: `${getDateString(4)}T11:30:00`,
    updated_at: `${getDateString(4)}T11:30:00`,
  },
  {
    id: 16,
    source: 'clickup',
    date: getDateString(5),
    content: '完成了代码审查，提出了几处优化建议，已反馈给开发者',
    created_at: `${getDateString(5)}T09:45:00`,
    updated_at: `${getDateString(5)}T09:45:00`,
  },
  {
    id: 18,
    source: 'git',
    date: getDateString(6),
    content: '修复了生产环境的紧急 bug，已部署热修复版本',
    created_at: `${getDateString(6)}T08:30:00`,
    updated_at: `${getDateString(6)}T08:30:00`,
  },
  {
    id: 19,
    source: 'slack',
    date: getDateString(6),
    content: '协调了跨部门合作，解决了资源分配问题',
    created_at: `${getDateString(6)}T10:20:00`,
    updated_at: `${getDateString(6)}T10:20:00`,
  },
  {
    id: 20,
    source: 'gmail',
    date: getDateString(0),
    content: '收到客户关于产品功能的咨询邮件，已回复并提供详细说明',
    created_at: `${getDateString(0)}T08:15:00`,
    updated_at: `${getDateString(0)}T08:15:00`,
  },
  {
    id: 21,
    source: 'gmail',
    date: getDateString(1),
    content: '收到供应商的合作提案邮件，需要进一步评估和讨论',
    created_at: `${getDateString(1)}T11:20:00`,
    updated_at: `${getDateString(1)}T11:20:00`,
  },
  {
    id: 22,
    source: 'alimail',
    date: getDateString(1),
    content: '收到阿里云关于服务器维护的通知邮件，已安排相应准备工作',
    created_at: `${getDateString(1)}T09:30:00`,
    updated_at: `${getDateString(1)}T09:30:00`,
  },
  {
    id: 23,
    source: 'gmail',
    date: getDateString(2),
    content: '收到团队成员的工作汇报邮件，项目进展顺利',
    created_at: `${getDateString(2)}T14:10:00`,
    updated_at: `${getDateString(2)}T14:10:00`,
  },
  {
    id: 24,
    source: 'alimail',
    date: getDateString(2),
    content: '收到阿里云账单通知，本月云服务费用在预算范围内',
    created_at: `${getDateString(2)}T16:45:00`,
    updated_at: `${getDateString(2)}T16:45:00`,
  },
  {
    id: 25,
    source: 'gmail',
    date: getDateString(3),
    content: '收到会议邀请邮件，已确认参加下周的技术分享会',
    created_at: `${getDateString(3)}T10:00:00`,
    updated_at: `${getDateString(3)}T10:00:00`,
  },
  {
    id: 26,
    source: 'alimail',
    date: getDateString(4),
    content: '收到阿里云安全提醒邮件，已检查并更新了安全配置',
    created_at: `${getDateString(4)}T13:20:00`,
    updated_at: `${getDateString(4)}T13:20:00`,
  },
  {
    id: 27,
    source: 'gmail',
    date: getDateString(5),
    content: '收到客户反馈邮件，对产品新功能表示满意',
    created_at: `${getDateString(5)}T15:30:00`,
    updated_at: `${getDateString(5)}T15:30:00`,
  },
  {
    id: 28,
    source: 'alimail',
    date: getDateString(5),
    content: '收到阿里云产品更新通知，新功能已上线可用',
    created_at: `${getDateString(5)}T11:15:00`,
    updated_at: `${getDateString(5)}T11:15:00`,
  },
  {
    id: 29,
    source: 'gmail',
    date: getDateString(7),
    content: '收到合作伙伴的商务合作邮件，已安排会议进一步沟通',
    created_at: `${getDateString(7)}T09:45:00`,
    updated_at: `${getDateString(7)}T09:45:00`,
  },
]

// 保留用于未来添加新数据项
// let nextDatabaseId = 21

export async function getAllDatabaseItems(): Promise<DatabaseItem[]> {
  await delay()
  return [...mockDatabaseItems].sort((a, b) => {
    if (!a.date || !b.date)
      return 0
    return b.date.localeCompare(a.date)
  })
}

export async function getDatabaseItemById(id: number): Promise<DatabaseItem | null> {
  await delay()
  return mockDatabaseItems.find(item => item.id === id) || null
}

export async function searchDatabaseItems(query: string, source?: string): Promise<DatabaseItem[]> {
  await delay()
  let results = mockDatabaseItems.filter((item) => {
    const text = item.content.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  if (source) {
    results = results.filter(item => item.source === source)
  }

  return results.sort((a, b) => {
    if (!a.date || !b.date)
      return 0
    return b.date.localeCompare(a.date)
  })
}
