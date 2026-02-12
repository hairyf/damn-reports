/**
 * 数据源工具定义（纯数据，可序列化存库）
 * 逻辑来源：tauri/src/service/collector
 */

import type { Collector } from '@/utils/exec'

export const git_directory: Collector = {
  name: 'Git Directory Reader',
  description: '读取本地 Git 仓库当日提交与 diff',
  type: 'exec',
  definition: {
    repository: { type: 'string', description: '本地 Git 仓库路径' },
    author: { type: 'string', description: '要筛选的提交作者名（commit author 包含此字符串）' },
  },
  executor: {
    command: 'git',
    args: ['-C', '{{repository}}', 'log', '--since=midnight', '--format=%h%x09%s%x09%an%x09%at', '--author={{author}}'],
  },
  transformer: '$split($, "\n")[$ != ""].($p := $split($, "\t"); $count($p) >= 4 ? {"summary": $p[1], "createdAt": $number($p[3]) * 1000, "data": {"id": $p[0], "message": $p[1], "author": $p[2], "date": $number($p[3])}} : null)[$]',
} as const

export const clickup: Collector = {
  name: 'ClickUp Tasks Reader',
  description: '读取 ClickUp 当日更新且分配给指定用户的任务',
  type: 'http',
  definition: {
    token: { type: 'string', description: 'ClickUp API Token' },
    team: { type: 'string', description: 'Team ID' },
    user: { type: 'string', description: '要筛选的 Assignee 用户 ID' },
  },
  executor: {
    baseUrl: 'https://api.clickup.com/api/v2',
    method: 'GET',
    path: '/team/{{team}}/task',
    headers: {
      Authorization: '{{token}}',
    },
    query: {
      'include_closed': 'true',
      'subtasks': 'true',
      'date_updated_gt': '{{date_updated_gt}}',
      'date_updated_lt': '{{date_updated_lt}}',
      'assignees[]': '{{user}}',
    },
  },
  transformer: 'tasks.{"summary": name, "createdAt": $number(date_created), "data": $}',
} as const
