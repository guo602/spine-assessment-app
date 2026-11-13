import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, UserPlus, Users, ChevronRight, ChevronLeft, CheckCircle2,
  Activity, HeartPulse, Brain, ShieldAlert, FileText, Copy, Check,
  Calendar, Sparkles, RotateCcw, TrendingDown, ClipboardList,
  AlertCircle, UserCheck, Stethoscope, HelpCircle, Eye, EyeOff,
  PlusCircle, Trash2, Lock, Unlock, KeyRound, X, LogOut, Loader2, QrCode, Mail
} from 'lucide-react';
import QRCode from 'qrcode';
import * as api from './api';

// ============================================================================
// 1. 完整问卷题库定义 (VAS / ODI 10项 / SF-36 36项 / SRS-22 22项)
// ============================================================================

// VAS 表情与临床疼痛分级配置
const VAS_LEVELS = [
  { score: 0, label: '无痛', desc: '完全没有任何疼痛感', color: '#10b981', bg: '#ecfdf5', face: '😊' },
  { score: 1, label: '极轻度痛', desc: '偶有轻微不适，不影响任何活动', color: '#22c55e', bg: '#f0fdf4', face: '🙂' },
  { score: 2, label: '轻度疼痛', desc: '可以忽略的轻微酸痛，不影响睡眠', color: '#84cc16', bg: '#f7fee7', face: '🙂' },
  { score: 3, label: '轻中度痛', desc: '能感受到疼痛，但仍可正常生活工作', color: '#eab308', bg: '#fefce8', face: '😐' },
  { score: 4, label: '中度疼痛', desc: '疼痛明显，注意力偶受干扰，睡眠轻度受影响', color: '#f59e0b', bg: '#fffbeb', face: '😕' },
  { score: 5, label: '中度持续痛', desc: '疼痛持续存在，部分日常体力活动受限', color: '#f97316', bg: '#fff7ed', face: '😟' },
  { score: 6, label: '中重度痛', desc: '疼痛显著，影响睡眠，需休息或药物缓解', color: '#ea580c', bg: '#ffedd5', face: '😣' },
  { score: 7, label: '重度疼痛', desc: '疼痛剧烈，无法集中精力，睡眠经常痛醒', color: '#ef4444', bg: '#fef2f2', face: '😖' },
  { score: 8, label: '剧烈疼痛', desc: '绝大多数活动因疼痛无法进行，被动体位', color: '#dc2626', bg: '#fef2f2', face: '😫' },
  { score: 9, label: '极度剧痛', desc: '疼痛难忍，伴随出汗或烦躁，无法入睡', color: '#b91c1c', bg: '#fef2f2', face: '😭' },
  { score: 10, label: '难以忍受剧痛', desc: '能想象到的最剧烈疼痛，痛不欲生', color: '#7f1d1d', bg: '#fef2f2', face: '😱' },
];

// 完整 ODI (Oswestry Disability Index) 10个维度问卷 (每题 0~5 分)
const ODI_QUESTIONS = [
  {
    id: 'odi_1',
    section: '第1部分：疼痛程度',
    shortTitle: '疼痛程度',
    options: [
      { value: 0, text: '我现在没有任何疼痛。' },
      { value: 1, text: '我现在只有非常轻微的疼痛。' },
      { value: 2, text: '我现在有中度的疼痛。' },
      { value: 3, text: '我现在有较重的疼痛。' },
      { value: 4, text: '我现在有非常剧烈的疼痛。' },
      { value: 5, text: '我现在的疼痛简直难以忍受。' }
    ]
  },
  {
    id: 'odi_2',
    section: '第2部分：日常生活自理能力（洗漱、穿脱衣服等）',
    shortTitle: '生活自理',
    options: [
      { value: 0, text: '我能正常料理个人生活，不会引起额外的疼痛。' },
      { value: 1, text: '我能正常料理个人生活，但会引起额外的疼痛。' },
      { value: 2, text: '料理个人生活时感到疼痛，我做起来动作缓慢而且小心翼翼。' },
      { value: 3, text: '我需要别人帮忙，但大部分个人生活仍能自己料理。' },
      { value: 4, text: '我料理绝大部分个人生活都需要别人帮助。' },
      { value: 5, text: '我无法自己穿衣，洗漱都很困难，只能卧床。' }
    ]
  },
  {
    id: 'odi_3',
    section: '第3部分：提举重物',
    shortTitle: '提举重物',
    options: [
      { value: 0, text: '我能提起重物，不会引起额外的疼痛。' },
      { value: 1, text: '我能提起重物，但会引起额外的疼痛。' },
      { value: 2, text: '由于疼痛我不能从地面提起重物，但如果放在合适高度（如桌子上）就能提起。' },
      { value: 3, text: '由于疼痛我不能提起重物，但如果放在合适高度，可以提起较轻的物品。' },
      { value: 4, text: '我只能提起非常轻的物品。' },
      { value: 5, text: '我完全不能提举任何物品。' }
    ]
  },
  {
    id: 'odi_4',
    section: '第4部分：行走能力',
    shortTitle: '行走能力',
    options: [
      { value: 0, text: '疼痛并没有限制我行走任何距离。' },
      { value: 1, text: '由于疼痛，我不能行走超过 1000 米（约1公里）。' },
      { value: 2, text: '由于疼痛，我不能行走超过 500 米。' },
      { value: 3, text: '由于疼痛，我不能行走超过 100 米。' },
      { value: 4, text: '我必须借助拐杖或助行器才能行走。' },
      { value: 5, text: '我绝大部分时间只能卧床，连去洗手间都极为困难。' }
    ]
  },
  {
    id: 'odi_5',
    section: '第5部分：坐立',
    shortTitle: '坐立情况',
    options: [
      { value: 0, text: '我可以在任何椅子上坐任意长的时间。' },
      { value: 1, text: '我只能在舒适的专用椅子上坐任意长的时间。' },
      { value: 2, text: '由于疼痛，我连续坐立不能超过 1 小时。' },
      { value: 3, text: '由于疼痛，我连续坐立不能超过 30 分钟。' },
      { value: 4, text: '由于疼痛，我连续坐立不能超过 10 分钟。' },
      { value: 5, text: '由于疼痛，我根本无法坐立。' }
    ]
  },
  {
    id: 'odi_6',
    section: '第6部分：站立',
    shortTitle: '站立情况',
    options: [
      { value: 0, text: '我可以站立任意长的时间，不会引起额外的疼痛。' },
      { value: 1, text: '我可以站立任意长的时间，但会引起额外的疼痛。' },
      { value: 2, text: '由于疼痛，我连续站立不能超过 1 小时。' },
      { value: 3, text: '由于疼痛，我连续站立不能超过 30 分钟。' },
      { value: 4, text: '由于疼痛，我连续站立不能超过 10 分钟。' },
      { value: 5, text: '由于疼痛，我根本无法站立。' }
    ]
  },
  {
    id: 'odi_7',
    section: '第7部分：睡眠',
    shortTitle: '睡眠质量',
    options: [
      { value: 0, text: '我的睡眠从不受疼痛影响。' },
      { value: 1, text: '我的睡眠偶尔受到疼痛影响。' },
      { value: 2, text: '由于疼痛，我的睡眠时间少于 6 小时。' },
      { value: 3, text: '由于疼痛，我的睡眠时间少于 4 小时。' },
      { value: 4, text: '由于疼痛，我的睡眠时间少于 2 小时。' },
      { value: 5, text: '由于疼痛，我彻夜难眠。' }
    ]
  },
  {
    id: 'odi_8',
    section: '第8部分：性生活（如不适用可选择跳过，按9项标准折算）',
    shortTitle: '性生活(可选)',
    optional: true,
    options: [
      { value: 0, text: '我的性生活正常，不会引起额外的疼痛。' },
      { value: 1, text: '我的性生活正常，但会引起一些额外的疼痛。' },
      { value: 2, text: '我的性生活基本正常，但会引起明显的疼痛。' },
      { value: 3, text: '由于疼痛，我的性生活受到严重限制。' },
      { value: 4, text: '由于疼痛，我几乎没有性生活。' },
      { value: 5, text: '由于疼痛，我完全不能进行性生活。' }
    ]
  },
  {
    id: 'odi_9',
    section: '第9部分：社会活动（聚会、文体休闲等）',
    shortTitle: '社会活动',
    options: [
      { value: 0, text: '我的社会活动正常，不会引起额外的疼痛。' },
      { value: 1, text: '我的社会活动正常，但会增加疼痛程度。' },
      { value: 2, text: '除了像运动那样剧烈的项目外，疼痛对我的社会活动没有显著影响。' },
      { value: 3, text: '疼痛限制了我的社会活动，使我不像以前那样经常外出。' },
      { value: 4, text: '疼痛使我的社会活动仅限于在家里进行。' },
      { value: 5, text: '由于疼痛，我没有任何社会活动。' }
    ]
  },
  {
    id: 'odi_10',
    section: '第10部分：郊游与旅行（乘车、出远门）',
    shortTitle: '外出旅行',
    options: [
      { value: 0, text: '我可以去任何地方旅行，不会引起疼痛。' },
      { value: 1, text: '我可以去任何地方旅行，但会引起额外的疼痛。' },
      { value: 2, text: '尽管疼痛难受，但我仍能坚持超过 2 小时的出行。' },
      { value: 3, text: '由于疼痛，我只能进行少于 1 小时的短途出行。' },
      { value: 4, text: '由于疼痛，我只能进行少于 30 分钟的必要短途出行。' },
      { value: 5, text: '由于疼痛，除了去医院看病外，我无法出行。' }
    ]
  }
];

// 完整详细的颈椎 JOA 评分问卷 (Japanese Orthopaedic Association 17分法)
const CERVICAL_JOA_QUESTIONS = [
  {
    id: 'joa_1',
    section: '第1部分：上肢运动功能（进餐与手部精细动作，0~4分）',
    category: '运动功能',
    maxScore: 4,
    options: [
      { value: 0, text: '0分：自己完全不能用筷子或勺子进餐，需他人喂食。' },
      { value: 1, text: '1分：能拿勺子进餐，但完全不能使用筷子。' },
      { value: 2, text: '2分：虽然手指不灵活、握持困难，但勉强能用筷子进餐。' },
      { value: 3, text: '3分：能用筷子进餐及处理日常活动，但手部动作略显笨拙（如扣纽扣稍慢）。' },
      { value: 4, text: '4分：上肢与手部精细动作完全正常，无任何笨拙感。' }
    ]
  },
  {
    id: 'joa_2',
    section: '第2部分：下肢运动功能（行走与上下楼梯能力，0~4分）',
    category: '运动功能',
    maxScore: 4,
    options: [
      { value: 0, text: '0分：完全不能站立或行走。' },
      { value: 1, text: '1分：即使在平地上行走，也必须有人搀扶或使用助行器/双拐。' },
      { value: 2, text: '2分：平地行走不需要搀扶，但上下楼梯必须扶着栏杆。' },
      { value: 3, text: '3分：平地行走及上下楼梯均不需扶持，但下肢不灵便、步态欠稳（或有踩棉花感）。' },
      { value: 4, text: '4分：下肢行走及跑跳功能完全正常。' }
    ]
  },
  {
    id: 'joa_3',
    section: '第3部分：上肢感觉功能（手臂与手指麻木/感觉减退，0~2分）',
    category: '感觉功能',
    maxScore: 2,
    options: [
      { value: 0, text: '0分：上肢或手部有明显的感觉障碍（重度麻木、痛温觉明显减退或丧失）。' },
      { value: 1, text: '1分：上肢或手指有轻度感觉障碍、麻木感或针刺蚂蚁爬感。' },
      { value: 2, text: '2分：上肢及手部感觉完全正常，无麻木或异常感觉。' }
    ]
  },
  {
    id: 'joa_4',
    section: '第4部分：下肢感觉功能（腿部与足部麻木/感觉减退，0~2分）',
    category: '感觉功能',
    maxScore: 2,
    options: [
      { value: 0, text: '0分：下肢或足底有明显的感觉障碍（重度麻木、痛温觉明显减退或丧失）。' },
      { value: 1, text: '1分：下肢或足部有轻度感觉障碍或轻度麻木感。' },
      { value: 2, text: '2分：下肢感觉完全正常，无麻木或异常感。' }
    ]
  },
  {
    id: 'joa_5',
    section: '第5部分：躯干感觉功能（胸腹部束带感/躯干感觉异常，0~2分）',
    category: '感觉功能',
    maxScore: 2,
    options: [
      { value: 0, text: '0分：胸腹部躯干有明显的感觉障碍或强烈的紧束感（束带感明显）。' },
      { value: 1, text: '1分：躯干有轻度感觉减退、轻微麻木或偶有轻度束带感。' },
      { value: 2, text: '2分：躯干感觉完全正常，无任何紧束感或麻木感。' }
    ]
  },
  {
    id: 'joa_6',
    section: '第6部分：膀胱排尿功能（括约肌功能评估，0~3分）',
    category: '膀胱功能',
    maxScore: 3,
    options: [
      { value: 0, text: '0分：严重排尿障碍（尿潴留需导尿，或完全性尿失禁）。' },
      { value: 1, text: '1分：高度排尿困难（排尿明显费力、残余尿多、尿不尽感强烈或偶有漏尿）。' },
      { value: 2, text: '2分：轻度排尿困难（尿频、排尿启动稍犹豫或尿流略变细）。' },
      { value: 3, text: '3分：排尿功能完全正常。' }
    ]
  }
];

// 完整详细的 NDI (Neck Disability Index) 颈椎功能障碍指数问卷 (10个维度，每题0~5分)
const NDI_QUESTIONS = [
  {
    id: 'ndi_1',
    section: '第1部分：颈部疼痛程度',
    shortTitle: '颈痛程度',
    options: [
      { value: 0, text: '我现在没有任何颈部疼痛。' },
      { value: 1, text: '我现在只有非常轻微的颈部疼痛。' },
      { value: 2, text: '我现在有中度的颈部疼痛。' },
      { value: 3, text: '我现在有较重的颈部疼痛。' },
      { value: 4, text: '我现在有非常剧烈的颈部疼痛。' },
      { value: 5, text: '我现在的颈部疼痛简直难以忍受。' }
    ]
  },
  {
    id: 'ndi_2',
    section: '第2部分：个人生活自理（洗漱、穿脱衣服等）',
    shortTitle: '生活自理',
    options: [
      { value: 0, text: '我能正常料理个人生活，不会引起额外的颈部疼痛。' },
      { value: 1, text: '我能正常料理个人生活，但会引起额外的颈部疼痛。' },
      { value: 2, text: '料理个人生活时感到颈痛，我动作缓慢且小心翼翼。' },
      { value: 3, text: '我需要别人帮忙，但大部分个人生活仍能自己料理。' },
      { value: 4, text: '我料理绝大部分个人生活都需要别人帮助。' },
      { value: 5, text: '我无法自己穿衣，洗漱都很困难，只能卧床休息。' }
    ]
  },
  {
    id: 'ndi_3',
    section: '第3部分：提举重物',
    shortTitle: '提举重物',
    options: [
      { value: 0, text: '我能提起重物，不会引起额外的颈部疼痛。' },
      { value: 1, text: '我能提起重物，但会引起额外的颈部疼痛。' },
      { value: 2, text: '由于颈痛我不能从地面提起重物，但放在合适高度（如桌子上）就能提起。' },
      { value: 3, text: '由于颈痛我不能提起重物，但放在合适高度可以提起较轻的物品。' },
      { value: 4, text: '我只能提起非常轻的物品。' },
      { value: 5, text: '我完全不能提举任何物品。' }
    ]
  },
  {
    id: 'ndi_4',
    section: '第4部分：阅读（看书、看电脑或看手机）',
    shortTitle: '阅读能力',
    options: [
      { value: 0, text: '我可以随意阅读任意长的时间，不会引起颈部疼痛。' },
      { value: 1, text: '我可以随意阅读任意长的时间，但会引起轻微的颈部疼痛。' },
      { value: 2, text: '我可以随意阅读任意长的时间，但会引起中度的颈部疼痛。' },
      { value: 3, text: '由于中度颈部疼痛，我不能阅读太长时间。' },
      { value: 4, text: '由于严重的颈部疼痛，我几乎无法阅读。' },
      { value: 5, text: '由于颈部疼痛，我完全不能阅读。' }
    ]
  },
  {
    id: 'ndi_5',
    section: '第5部分：头痛症状',
    shortTitle: '头痛情况',
    options: [
      { value: 0, text: '我完全没有头痛。' },
      { value: 1, text: '我偶有轻微的头痛。' },
      { value: 2, text: '我偶有中度的头痛。' },
      { value: 3, text: '我经常有中度的头痛。' },
      { value: 4, text: '我经常有严重的头痛。' },
      { value: 5, text: '我几乎一直都有剧烈的头痛。' }
    ]
  },
  {
    id: 'ndi_6',
    section: '第6部分：集中注意力',
    shortTitle: '注意力',
    options: [
      { value: 0, text: '只要我想，我能完全集中注意力，没有任何困难。' },
      { value: 1, text: '只要我想，我能集中注意力，但有一点困难。' },
      { value: 2, text: '我集中注意力有一定程度的困难。' },
      { value: 3, text: '我集中注意力有很大的困难。' },
      { value: 4, text: '我集中注意力有极大的困难。' },
      { value: 5, text: '由于颈部不适，我完全无法集中注意力。' }
    ]
  },
  {
    id: 'ndi_7',
    section: '第7部分：工作能力（办公室工作或日常家务）',
    shortTitle: '工作能力',
    options: [
      { value: 0, text: '我能做我想做的任何工作，不受限制。' },
      { value: 1, text: '我只能做平时的常规工作，但不能做额外的工作。' },
      { value: 2, text: '我能做大部分平时的常规工作，但不能做额外的工作。' },
      { value: 3, text: '我不能做平时的常规工作。' },
      { value: 4, text: '我勉强只能做一点点非常轻松的工作。' },
      { value: 5, text: '由于颈部问题，我完全不能做任何工作。' }
    ]
  },
  {
    id: 'ndi_8',
    section: '第8部分：驾驶汽车或骑车（如不适用可选择跳过，按9项折算）',
    shortTitle: '驾驶(可选)',
    optional: true,
    options: [
      { value: 0, text: '我能正常驾驶或骑车，没有任何颈部疼痛。' },
      { value: 1, text: '我能正常驾驶或骑车任意长时间，但会有轻微颈部疼痛。' },
      { value: 2, text: '我能正常驾驶或骑车任意长时间，但会有中度颈部疼痛。' },
      { value: 3, text: '由于中度颈部疼痛，我不能长时间驾驶或骑车。' },
      { value: 4, text: '由于严重的颈部疼痛，我几乎不能驾驶或骑车。' },
      { value: 5, text: '由于颈部疼痛，我完全无法驾驶或骑车。' }
    ]
  },
  {
    id: 'ndi_9',
    section: '第9部分：睡眠质量',
    shortTitle: '睡眠质量',
    options: [
      { value: 0, text: '我的睡眠完全正常，不受颈痛影响。' },
      { value: 1, text: '我的睡眠受到极轻微影响（每晚失眠少于 1 小时）。' },
      { value: 2, text: '我的睡眠受到轻度影响（每晚失眠 1～2 小时）。' },
      { value: 3, text: '我的睡眠受到中度影响（每晚失眠 2～3 小时）。' },
      { value: 4, text: '我的睡眠受到重度影响（每晚失眠 3～5 小时）。' },
      { value: 5, text: '我的睡眠受到极重度影响（每晚失眠 5～7 小时或彻夜难眠）。' }
    ]
  },
  {
    id: 'ndi_10',
    section: '第10部分：休闲娱乐活动',
    shortTitle: '休闲娱乐',
    options: [
      { value: 0, text: '我能参加所有的休闲娱乐活动，没有任何颈部疼痛。' },
      { value: 1, text: '我能参加所有的休闲娱乐活动，但会有一些颈部疼痛。' },
      { value: 2, text: '由于颈部疼痛，我只能参加大部分（而非全部）平时喜欢的休闲活动。' },
      { value: 3, text: '由于颈部疼痛，我只能参加少部分平时喜欢的休闲活动。' },
      { value: 4, text: '由于颈部疼痛，我几乎不能参加任何休闲娱乐活动。' },
      { value: 5, text: '由于颈部疼痛，我完全不能参加任何休闲娱乐活动。' }
    ]
  }
];

// 完整 SF-36 问卷 36 道题分组定义（保持横向分模块高效作答）
const SF36_GROUPS = [
  {
    groupId: 'gh_ht',
    title: '一、总体健康与健康变化（第 1~2 题）',
    desc: '评估您对自身整体健康状况的直观感受及与一年前的对比',
    questions: [
      {
        id: 'sf_1',
        num: '1',
        dim: 'GH',
        text: '总体来讲，您的健康状况是：',
        options: [
          { value: 1, label: '非常好' },
          { value: 2, label: '很好' },
          { value: 3, label: '好' },
          { value: 4, label: '一般' },
          { value: 5, label: '差' }
        ]
      },
      {
        id: 'sf_2',
        num: '2',
        dim: 'HT',
        text: '跟 1 年前相比，您觉得您现在的健康状况总的来说如何？',
        options: [
          { value: 1, label: '比1年前好多了' },
          { value: 2, label: '比1年前好一些' },
          { value: 3, label: '跟1年前差不多' },
          { value: 4, label: '比1年前差一些' },
          { value: 5, label: '比1年前差多了' }
        ]
      }
    ]
  },
  {
    groupId: 'pf',
    title: '二、生理机能 PF：日常体力活动受限程度（第 3a~3j 题，共10题）',
    desc: '下列各项是您日常生活中可能进行的活动。以您目前的健康状况，进行这些活动时是否受到限制？',
    questions: [
      { id: 'sf_3a', num: '3a', dim: 'PF', text: '重体力活动（如跑步、举重物、参加剧烈运动）' },
      { id: 'sf_3b', num: '3b', dim: 'PF', text: '适度的活动（如移动一张桌子、扫地、打太极拳、做简单体操）' },
      { id: 'sf_3c', num: '3c', dim: 'PF', text: '手提日杂用品（如买菜、购物提东西）' },
      { id: 'sf_3d', num: '3d', dim: 'PF', text: '上几层楼梯' },
      { id: 'sf_3e', num: '3e', dim: 'PF', text: '上一层楼梯' },
      { id: 'sf_3f', num: '3f', dim: 'PF', text: '弯腰、屈膝或下蹲' },
      { id: 'sf_3g', num: '3g', dim: 'PF', text: '步行超过 1500 米（约3里路）' },
      { id: 'sf_3h', num: '3h', dim: 'PF', text: '步行几百米（几个街口）' },
      { id: 'sf_3i', num: '3i', dim: 'PF', text: '步行约 100 米（一个街口）' },
      { id: 'sf_3j', num: '3j', dim: 'PF', text: '自己洗澡或穿衣' }
    ].map(q => ({
      ...q,
      options: [
        { value: 1, label: '限制很大' },
        { value: 2, label: '有些限制' },
        { value: 3, label: '毫无限制' }
      ]
    }))
  },
  {
    groupId: 'rp_re',
    title: '三、生理职能 RP 与 情感职能 RE（第 4a~4d & 5a~5c 题，共7题）',
    desc: '在过去 4 周里，您的工作或日常活动是否因为身体健康或情绪问题而出现以下情况？',
    questions: [
      { id: 'sf_4a', num: '4a', dim: 'RP', text: '【躯体健康原因】减少了工作或其他活动的时间？' },
      { id: 'sf_4b', num: '4b', dim: 'RP', text: '【躯体健康原因】本来想要做的事情只能完成一部分？' },
      { id: 'sf_4c', num: '4c', dim: 'RP', text: '【躯体健康原因】想要干的工作或活动种类受到限制？' },
      { id: 'sf_4d', num: '4d', dim: 'RP', text: '【躯体健康原因】完成工作或其他活动时感到困难（例如需要额外努力）？' },
      { id: 'sf_5a', num: '5a', dim: 'RE', text: '【情绪原因（如压抑或忧虑）】减少了工作或日常活动的时间？' },
      { id: 'sf_5b', num: '5b', dim: 'RE', text: '【情绪原因】本来想要做的事情只能完成一部分？' },
      { id: 'sf_5c', num: '5c', dim: 'RE', text: '【情绪原因】干事情不如平时那样仔细？' }
    ].map(q => ({
      ...q,
      options: [
        { value: 1, label: '是（受影响）' },
        { value: 2, label: '否（未受影响）' }
      ]
    }))
  },
  {
    groupId: 'sf_bp',
    title: '四、社会功能 SF 与 躯体疼痛 BP（第 6、7、8、10 题，共4题）',
    desc: '评估过去 4 周内疼痛及健康问题对正常社交、家务与工作的影响',
    questions: [
      {
        id: 'sf_6',
        num: '6',
        dim: 'SF',
        text: '在过去 4 周里，您的身体健康或情绪问题在多大程度上妨碍了您与家人、朋友、邻居或集体的正常社交活动？',
        options: [
          { value: 1, label: '完全没有妨碍' },
          { value: 2, label: '有一点妨碍' },
          { value: 3, label: '中度妨碍' },
          { value: 4, label: '相当大妨碍' },
          { value: 5, label: '极其严重妨碍' }
        ]
      },
      {
        id: 'sf_7',
        num: '7',
        dim: 'BP',
        text: '在过去 4 周里，您身体疼痛的程度有多严重？',
        options: [
          { value: 1, label: '完全不痛' },
          { value: 2, label: '非常轻微' },
          { value: 3, label: '轻度疼痛' },
          { value: 4, label: '中度疼痛' },
          { value: 5, label: '重度疼痛' },
          { value: 6, label: '非常剧烈疼痛' }
        ]
      },
      {
        id: 'sf_8',
        num: '8',
        dim: 'BP',
        text: '在过去 4 周里，身体疼痛在多大程度上妨碍了您的正常工作（包括外出工作和家务劳动）？',
        options: [
          { value: 1, label: '完全没有妨碍' },
          { value: 2, label: '有一点妨碍' },
          { value: 3, label: '中度妨碍' },
          { value: 4, label: '相当大妨碍' },
          { value: 5, label: '极其严重妨碍' }
        ]
      },
      {
        id: 'sf_10',
        num: '10',
        dim: 'SF',
        text: '在过去 4 周里，有多少时间您的身体健康或情绪问题妨碍了您的社交活动（如走亲访友）？',
        options: [
          { value: 1, label: '所有的时间' },
          { value: 2, label: '大部分时间' },
          { value: 3, label: '一部分时间' },
          { value: 4, label: '小部分时间' },
          { value: 5, label: '没有这种时间' }
        ]
      }
    ]
  },
  {
    groupId: 'vt_mh',
    title: '五、精力 VT 与 精神健康 MH（第 9a~9i 题，共9题）',
    desc: '以下问题有关您在过去 4 周里感觉如何以及情况怎样，请选择最接近您感觉的答案：',
    questions: [
      { id: 'sf_9a', num: '9a', dim: 'VT', text: '您觉得生活充实、充满活力吗？' },
      { id: 'sf_9b', num: '9b', dim: 'MH', text: '您是一个非常紧张敏感的人吗？' },
      { id: 'sf_9c', num: '9c', dim: 'MH', text: '您觉得情绪低落，没有什么事情能使您高兴起来吗？' },
      { id: 'sf_9d', num: '9d', dim: 'MH', text: '您觉得心里平静和谐吗？' },
      { id: 'sf_9e', num: '9e', dim: 'VT', text: '您觉得精力充沛吗？' },
      { id: 'sf_9f', num: '9f', dim: 'MH', text: '您觉得心情灰心、忧郁吗？' },
      { id: 'sf_9g', num: '9g', dim: 'VT', text: '您觉得筋疲力尽吗？' },
      { id: 'sf_9h', num: '9h', dim: 'MH', text: '您是一个快乐的人吗？' },
      { id: 'sf_9i', num: '9i', dim: 'VT', text: '您觉得疲倦、累吗？' }
    ].map(q => ({
      ...q,
      options: [
        { value: 1, label: '所有的时间' },
        { value: 2, label: '大部分时间' },
        { value: 3, label: '比较多时间' },
        { value: 4, label: '一部分时间' },
        { value: 5, label: '小部分时间' },
        { value: 6, label: '没有这种时间' }
      ]
    }))
  },
  {
    groupId: 'gh_statements',
    title: '六、一般健康状况感知 GH（第 11a~11d 题，共4题）',
    desc: '请判断下述每一句话对您来说是对还是错：',
    questions: [
      { id: 'sf_11a', num: '11a', dim: 'GH', text: '我好像比别人更容易生病。' },
      { id: 'sf_11b', num: '11b', dim: 'GH', text: '我跟周围认识的人一样健康。' },
      { id: 'sf_11c', num: '11c', dim: 'GH', text: '我认为我的健康状况将会变坏。' },
      { id: 'sf_11d', num: '11d', dim: 'GH', text: '我的健康状况极好。' }
    ].map(q => ({
      ...q,
      options: [
        { value: 1, label: '绝对正确' },
        { value: 2, label: '大部分正确' },
        { value: 3, label: '不能肯定' },
        { value: 4, label: '大部分错误' },
        { value: 5, label: '绝对错误' }
      ]
    }))
  }
];

// 完整 SRS-22 (Scoliosis Research Society-22r) 22道标准题 (每题 1~5 分，5分为最佳状态，1分为最差状态)
const SRS22_QUESTIONS = [
  {
    id: 'srs_1', num: 1, domain: 'pain', domainName: '疼痛维度',
    text: '在过去 6 个月里，您经历的背部疼痛程度如何？',
    options: [
      { score: 5, label: '无疼痛' },
      { score: 4, label: '轻度疼痛' },
      { score: 3, label: '中度疼痛' },
      { score: 2, label: '中重度疼痛' },
      { score: 1, label: '重度剧烈疼痛' }
    ]
  },
  {
    id: 'srs_2', num: 2, domain: 'pain', domainName: '疼痛维度',
    text: '在过去 1 个月里，您经历的背部疼痛程度如何？',
    options: [
      { score: 5, label: '无疼痛' },
      { score: 4, label: '轻度疼痛' },
      { score: 3, label: '中度疼痛' },
      { score: 2, label: '中重度疼痛' },
      { score: 1, label: '重度剧烈疼痛' }
    ]
  },
  {
    id: 'srs_3', num: 3, domain: 'mental', domainName: '心理健康',
    text: '在过去 6 个月里，您是一个非常容易紧张焦虑的人吗？',
    options: [
      { score: 5, label: '从不' },
      { score: 4, label: '很少时间' },
      { score: 3, label: '有时' },
      { score: 2, label: '大部分时间' },
      { score: 1, label: '所有时间' }
    ]
  },
  {
    id: 'srs_4', num: 4, domain: 'image', domainName: '自我形象/外观',
    text: '如果您的背部保持目前的形状度过余生，您的感受如何？',
    options: [
      { score: 5, label: '非常满意/非常高兴' },
      { score: 4, label: '比较满意' },
      { score: 3, label: '无所谓（既不满意也不沮丧）' },
      { score: 2, label: '不太满意' },
      { score: 1, label: '非常不满意/极度沮丧' }
    ]
  },
  {
    id: 'srs_5', num: 5, domain: 'function', domainName: '功能/活动度',
    text: '您目前的日常活动能力处于什么水平？',
    options: [
      { score: 5, label: '完全正常，活动不受任何限制' },
      { score: 4, label: '能做绝大多数日常活动' },
      { score: 3, label: '能进行轻度体力活动及家务' },
      { score: 2, label: '活动严重受限，仅能简单自理' },
      { score: 1, label: '完全卧床或坐轮椅' }
    ]
  },
  {
    id: 'srs_6', num: 6, domain: 'image', domainName: '自我形象/外观',
    text: '您穿上衣服后看镜子里的自己，外观感觉如何？',
    options: [
      { score: 5, label: '非常好' },
      { score: 4, label: '好' },
      { score: 3, label: '一般' },
      { score: 2, label: '不好' },
      { score: 1, label: '非常糟糕' }
    ]
  },
  {
    id: 'srs_7', num: 7, domain: 'mental', domainName: '心理健康',
    text: '在过去 6 个月里，您是否感到情绪极其低落，以至于什么事都提不起精神？',
    options: [
      { score: 5, label: '从不' },
      { score: 4, label: '很少时间' },
      { score: 3, label: '有时' },
      { score: 2, label: '大部分时间' },
      { score: 1, label: '所有时间' }
    ]
  },
  {
    id: 'srs_8', num: 8, domain: 'pain', domainName: '疼痛维度',
    text: '您在安静休息时是否感到背部疼痛？',
    options: [
      { score: 5, label: '从不疼痛' },
      { score: 4, label: '很少疼痛' },
      { score: 3, label: '有时疼痛' },
      { score: 2, label: '经常疼痛' },
      { score: 1, label: '绝大多数时间都痛' }
    ]
  },
  {
    id: 'srs_9', num: 9, domain: 'function', domainName: '功能/活动度',
    text: '您目前在工作、上学或做家务时的能力达到正常水平的多少？',
    options: [
      { score: 5, label: '100% 正常水平' },
      { score: 4, label: '75% 正常水平' },
      { score: 3, label: '50% 正常水平' },
      { score: 2, label: '25% 正常水平' },
      { score: 1, label: '0%（完全无法工作/上学/家务）' }
    ]
  },
  {
    id: 'srs_10', num: 10, domain: 'image', domainName: '自我形象/外观',
    text: '下列哪项最能描述您躯干（除头和四肢以外的身体部分）的外观？',
    options: [
      { score: 5, label: '非常好' },
      { score: 4, label: '好' },
      { score: 3, label: '一般' },
      { score: 2, label: '较差' },
      { score: 1, label: '非常差/严重畸形感' }
    ]
  },
  {
    id: 'srs_11', num: 11, domain: 'pain', domainName: '疼痛维度',
    text: '您目前因为背痛服用药物的情况是？',
    options: [
      { score: 5, label: '完全不服药' },
      { score: 4, label: '每周使用非处方止痛药 ≤ 1次' },
      { score: 3, label: '每天使用非处方止痛药' },
      { score: 2, label: '每周使用强效处方止痛药 ≤ 1次' },
      { score: 1, label: '每天必须使用强效处方止痛药' }
    ]
  },
  {
    id: 'srs_12', num: 12, domain: 'function', domainName: '功能/活动度',
    text: '您的背部问题是否限制了您做家务或绕房屋周边走动？',
    options: [
      { score: 5, label: '从不限制' },
      { score: 4, label: '很少限制' },
      { score: 3, label: '有时限制' },
      { score: 2, label: '经常限制' },
      { score: 1, label: '总是严重限制' }
    ]
  },
  {
    id: 'srs_13', num: 13, domain: 'mental', domainName: '心理健康',
    text: '在过去 6 个月里，您感到心平气和、内心安宁的时间有多少？',
    options: [
      { score: 5, label: '所有时间' },
      { score: 4, label: '大部分时间' },
      { score: 3, label: '有时' },
      { score: 2, label: '很少时间' },
      { score: 1, label: '从不' }
    ]
  },
  {
    id: 'srs_14', num: 14, domain: 'image', domainName: '自我形象/外观',
    text: '您认为您的背部状况是否影响了您与他人的个人关系？',
    options: [
      { score: 5, label: '完全没有影响' },
      { score: 4, label: '轻微影响' },
      { score: 3, label: '中度影响' },
      { score: 2, label: '较大影响' },
      { score: 1, label: '严重影响' }
    ]
  },
  {
    id: 'srs_15', num: 15, domain: 'function', domainName: '功能/活动度',
    text: '您和您的家人是否因为您的背部问题而在经济上遇到困难？',
    options: [
      { score: 5, label: '完全没有' },
      { score: 4, label: '轻微困难' },
      { score: 3, label: '中度困难' },
      { score: 2, label: '很大困难' },
      { score: 1, label: '极其严重困难' }
    ]
  },
  {
    id: 'srs_16', num: 16, domain: 'mental', domainName: '心理健康',
    text: '在过去 6 个月里，您感到心情沮丧、消沉吗？',
    options: [
      { score: 5, label: '从不' },
      { score: 4, label: '很少时间' },
      { score: 3, label: '有时' },
      { score: 2, label: '大部分时间' },
      { score: 1, label: '所有时间' }
    ]
  },
  {
    id: 'srs_17', num: 17, domain: 'pain', domainName: '疼痛维度',
    text: '在过去 3 个月里，您是否因背痛而向学校请假或向单位请病假（含无法做家务）？',
    options: [
      { score: 5, label: '0 天' },
      { score: 4, label: '1 天' },
      { score: 3, label: '2 天' },
      { score: 2, label: '3 天' },
      { score: 1, label: '4 天及以上' }
    ]
  },
  {
    id: 'srs_18', num: 18, domain: 'function', domainName: '功能/活动度',
    text: '您的背部状况是否限制了您与朋友外出社交？',
    options: [
      { score: 5, label: '从不限制' },
      { score: 4, label: '很少限制' },
      { score: 3, label: '有时限制' },
      { score: 2, label: '经常限制' },
      { score: 1, label: '总是严重限制' }
    ]
  },
  {
    id: 'srs_19', num: 19, domain: 'image', domainName: '自我形象/外观',
    text: '鉴于您目前的背部状况，您觉得自己是否有吸引力（外貌自信度）？',
    options: [
      { score: 5, label: '非常有吸引力' },
      { score: 4, label: '比较有吸引力' },
      { score: 3, label: '一般（既不突出也不差）' },
      { score: 2, label: '不太有吸引力' },
      { score: 1, label: '完全没有吸引力' }
    ]
  },
  {
    id: 'srs_20', num: 20, domain: 'mental', domainName: '心理健康',
    text: '在过去 6 个月里，您是一个快乐的人吗？',
    options: [
      { score: 5, label: '所有时间' },
      { score: 4, label: '大部分时间' },
      { score: 3, label: '有时' },
      { score: 2, label: '很少时间' },
      { score: 1, label: '从不' }
    ]
  },
  {
    id: 'srs_21', num: 21, domain: 'satisfaction', domainName: '治疗满意度',
    text: '您对目前背部治疗（或评估管理）的结果满意吗？',
    options: [
      { score: 5, label: '非常满意' },
      { score: 4, label: '满意' },
      { score: 3, label: '一般（既非满意也非不满）' },
      { score: 2, label: '不满意' },
      { score: 1, label: '非常不满意' }
    ]
  },
  {
    id: 'srs_22', num: 22, domain: 'satisfaction', domainName: '治疗满意度',
    text: '如果您的背部再次出现相同的情况，您还会选择接受同样的治疗方案吗？',
    options: [
      { score: 5, label: '绝对会' },
      { score: 4, label: '可能会' },
      { score: 3, label: '不确定' },
      { score: 2, label: '可能不会' },
      { score: 1, label: '绝对不会' }
    ]
  }
];

// ============================================================================
// 2. 医学评分计算核心算法 (ODI / SF-36 八维度与PCS、MCS / SRS-22 五维度)
// ============================================================================

// 计算 ODI 百分比得分 (0~100%)
function calculateODI(odiAnswers) {
  let sum = 0;
  let answeredCount = 0;
  ODI_QUESTIONS.forEach(q => {
    const val = odiAnswers[q.id];
    if (val !== undefined && val !== null && val !== 'skip') {
      sum += Number(val);
      answeredCount += 1;
    }
  });
  if (answeredCount === 0) return 0;
  const rawScore = (sum / (answeredCount * 5)) * 100;
  return Number(rawScore.toFixed(1));
}

// 计算颈椎 JOA 评分 (0~17分，满分17分)
function calculateJOA(joaAnswers) {
  const get = (id, defVal) => (joaAnswers[id] !== undefined ? Number(joaAnswers[id]) : defVal);
  const motorUpper = get('joa_1', 4);
  const motorLower = get('joa_2', 4);
  const sensoryUpper = get('joa_3', 2);
  const sensoryLower = get('joa_4', 2);
  const sensoryTrunk = get('joa_5', 2);
  const bladder = get('joa_6', 3);
  const total = motorUpper + motorLower + sensoryUpper + sensoryLower + sensoryTrunk + bladder;
  return {
    motorUpper,
    motorLower,
    sensoryTotal: sensoryUpper + sensoryLower + sensoryTrunk,
    bladder,
    total
  };
}

// 计算 NDI 颈椎功能障碍指数百分比得分 (0~100%)
function calculateNDI(ndiAnswers) {
  let sum = 0;
  let answeredCount = 0;
  NDI_QUESTIONS.forEach(q => {
    const val = ndiAnswers[q.id];
    if (val !== undefined && val !== null && val !== 'skip') {
      sum += Number(val);
      answeredCount += 1;
    }
  });
  if (answeredCount === 0) return 0;
  const rawScore = (sum / (answeredCount * 5)) * 100;
  return Number(rawScore.toFixed(1));
}

// 计算 SF-36 各维度 (0-100) 及 PCS (躯体健康总评) & MCS (精神健康总评)
function calculateSF36(sfAnswers) {
  const get = (id, fallback) => (sfAnswers[id] !== undefined ? Number(sfAnswers[id]) : fallback);

  // 1. PF (生理机能): 3a-3j (1=限制很大, 2=有些限制, 3=毫无限制) -> 原始分 10~30, 跨度20
  const pfItems = ['sf_3a', 'sf_3b', 'sf_3c', 'sf_3d', 'sf_3e', 'sf_3f', 'sf_3g', 'sf_3h', 'sf_3i', 'sf_3j'];
  const pfSum = pfItems.reduce((acc, k) => acc + get(k, 2), 0);
  const PF = ((pfSum - 10) / 20) * 100;

  // 2. RP (生理职能): 4a-4d (1=是, 2=否) -> 原始分 4~8, 跨度4
  const rpItems = ['sf_4a', 'sf_4b', 'sf_4c', 'sf_4d'];
  const rpSum = rpItems.reduce((acc, k) => acc + get(k, 2), 0);
  const RP = ((rpSum - 4) / 4) * 100;

  // 3. BP (躯体疼痛): 7 (1~6反向), 8 (1~5反向) -> 转换至 0-100
  const q7 = get('sf_7', 3);
  const q8 = get('sf_8', 2);
  const recode7 = { 1: 6.0, 2: 5.4, 3: 4.2, 4: 3.1, 5: 2.2, 6: 1.0 }[q7] || 4.2;
  const recode8 = (q7 === 1 && q8 === 1) ? 6.0 : ({ 1: 5.0, 2: 4.0, 3: 3.0, 4: 2.0, 5: 1.0 }[q8] || 4.0);
  const BP = ((recode7 + recode8 - 2) / 10) * 100;

  // 4. GH (一般健康): 1 (反向), 11a (正向), 11b (反向), 11c (正向), 11d (反向) -> 原始分 5~25, 跨度20
  const q1 = { 1: 5.0, 2: 4.4, 3: 3.4, 4: 2.0, 5: 1.0 }[get('sf_1', 3)] || 3.4;
  const q11a = get('sf_11a', 3);
  const q11b = 6 - get('sf_11b', 3);
  const q11c = get('sf_11c', 3);
  const q11d = 6 - get('sf_11d', 3);
  const GH = ((q1 + q11a + q11b + q11c + q11d - 5) / 20) * 100;

  // 5. VT (精力): 9a(反), 9e(反), 9g(正), 9i(正) -> 原始分 4~24, 跨度20
  const q9a = 7 - get('sf_9a', 3);
  const q9e = 7 - get('sf_9e', 3);
  const q9g = get('sf_9g', 4);
  const q9i = get('sf_9i', 4);
  const VT = ((q9a + q9e + q9g + q9i - 4) / 20) * 100;

  // 6. SF (社会功能): 6(反), 10(正) -> 原始分 2~10, 跨度8
  const q6 = 6 - get('sf_6', 2);
  const q10 = get('sf_10', 4);
  const SF = ((q6 + q10 - 2) / 8) * 100;

  // 7. RE (情感职能): 5a-5c (1=是, 2=否) -> 原始分 3~6, 跨度3
  const reItems = ['sf_5a', 'sf_5b', 'sf_5c'];
  const reSum = reItems.reduce((acc, k) => acc + get(k, 2), 0);
  const RE = ((reSum - 3) / 3) * 100;

  // 8. MH (精神健康): 9b(正), 9c(正), 9d(反), 9f(正), 9h(反) -> 原始分 5~30, 跨度25
  const q9b = get('sf_9b', 4);
  const q9c = get('sf_9c', 5);
  const q9d = 7 - get('sf_9d', 3);
  const q9f = get('sf_9f', 4);
  const q9h = 7 - get('sf_9h', 3);
  const MH = ((q9b + q9c + q9d + q9f + q9h - 5) / 25) * 100;

  // 标准 SF-36 PCS 与 MCS 正态标准化 T 分数换算 (均值50，标准差10)
  const zPF = (PF - 84.52) / 22.89;
  const zRP = (RP - 81.20) / 33.80;
  const zBP = (BP - 75.49) / 23.56;
  const zGH = (GH - 72.21) / 20.17;
  const zVT = (VT - 61.05) / 20.87;
  const zSF = (SF - 83.60) / 22.38;
  const zRE = (RE - 81.29) / 33.03;
  const zMH = (MH - 74.84) / 18.01;

  const rawPCS =
    zPF * 0.42402 +
    zRP * 0.35119 +
    zBP * 0.31754 +
    zGH * 0.24954 +
    zVT * 0.02877 +
    zSF * -0.00753 +
    zRE * -0.19206 +
    zMH * -0.22069;

  const rawMCS =
    zPF * -0.22999 +
    zRP * -0.12329 +
    zBP * -0.09731 +
    zGH * -0.01571 +
    zVT * 0.23534 +
    zSF * 0.26876 +
    zRE * 0.43407 +
    zMH * 0.48581;

  const PCS = Math.max(10, Math.min(75, Number((50 + rawPCS * 10).toFixed(1))));
  const MCS = Math.max(10, Math.min(75, Number((50 + rawMCS * 10).toFixed(1))));

  return {
    PF: Math.round(PF),
    RP: Math.round(RP),
    BP: Math.round(BP),
    GH: Math.round(GH),
    VT: Math.round(VT),
    SF: Math.round(SF),
    RE: Math.round(RE),
    MH: Math.round(MH),
    PCS,
    MCS
  };
}

// 计算 SRS-22 五个维度均分 (1.0 ~ 5.0)
function calculateSRS22(srsAnswers) {
  const getScore = (id) => (srsAnswers[id] !== undefined ? Number(srsAnswers[id]) : 3);
  const avg = (ids) => {
    const sum = ids.reduce((acc, id) => acc + getScore(id), 0);
    return Number((sum / ids.length).toFixed(1));
  };

  const functionScore = avg(['srs_5', 'srs_9', 'srs_12', 'srs_15', 'srs_18']);
  const painScore = avg(['srs_1', 'srs_2', 'srs_8', 'srs_11', 'srs_17']);
  const imageScore = avg(['srs_4', 'srs_6', 'srs_10', 'srs_14', 'srs_19']);
  const mentalScore = avg(['srs_3', 'srs_7', 'srs_13', 'srs_16', 'srs_20']);
  const satisfactionScore = avg(['srs_21', 'srs_22']);

  const allIds = SRS22_QUESTIONS.map((q) => q.id);
  const totalScore = Number((allIds.reduce((acc, id) => acc + getScore(id), 0) / 22).toFixed(2));

  return {
    function: functionScore,
    pain: painScore,
    image: imageScore,
    mental: mentalScore,
    satisfaction: satisfactionScore,
    total: totalScore
  };
}

// 生成结构化临床结果解读（严格匹配用户要求的三层面临床报告格式，支持腰椎与颈椎双分支）
function generateClinicalInterpretation({
  spineRegion = 'lumbar',
  backVas,
  legVas,
  odiScore,
  neckVas,
  armVas,
  joaResult,
  ndiScore,
  sf36,
  srs22,
  srs22Skipped
}) {
  if (spineRegion === 'cervical') {
    // 颈椎疾病患者三层面结果解读
    let neckPainDesc = '无明显颈痛';
    if (neckVas >= 7) neckPainDesc = '重度颈部疼痛';
    else if (neckVas >= 4) neckPainDesc = '中度颈部疼痛';
    else if (neckVas >= 1) neckPainDesc = '轻度颈部疼痛';

    let ndiDesc = '轻度颈椎功能障碍';
    if (ndiScore > 70) ndiDesc = '完全性颈椎功能障碍';
    else if (ndiScore > 50) ndiDesc = '重度颈椎功能障碍';
    else if (ndiScore > 30) ndiDesc = '中度颈椎功能障碍';
    else if (ndiScore > 10) ndiDesc = '轻度颈椎功能障碍';
    else ndiDesc = '日常颈椎功能基本正常';

    let pcsDesc = '躯体健康维持良好';
    if (sf36.PCS < 35) pcsDesc = '躯体健康严重受损';
    else if (sf36.PCS < 43) pcsDesc = '躯体健康显著下降';
    else if (sf36.PCS < 48) pcsDesc = '躯体健康轻度下降';

    const physicalLine = `躯体层面：${neckPainDesc}导致${ndiDesc}（NDI ${ndiScore}），${pcsDesc}（PCS ${sf36.PCS}）`;

    let mcsDesc = '情绪状态相对平稳';
    if (sf36.MCS < 38) mcsDesc = '伴明显焦虑或抑郁倾向';
    else if (sf36.MCS < 43) mcsDesc = '情绪状态轻度波动';
    else if (sf36.MCS >= 50) mcsDesc = '心理与情绪状态积极良好';

    const mentalLine = `心理层面：${mcsDesc}（MCS ${sf36.MCS}），慢性颈肩不适及睡眠/阅读受限对患者日常精力具有一定影响（VT ${sf36.VT} 分）`;

    const joaTotal = joaResult?.total ?? 17;
    let joaSeverity = '脊髓功能正常';
    if (joaTotal < 9) joaSeverity = '重度颈髓功能障碍';
    else if (joaTotal <= 12) joaSeverity = '中度颈髓功能障碍';
    else if (joaTotal <= 15) joaSeverity = '轻度颈髓功能损害';

    let neuroLine = '';
    if (armVas === 0 && joaTotal >= 16) {
      neuroLine = `神经层面：无上肢放射痛或麻木症状（上肢 VAS 0），颈椎 JOA 评分 ${joaTotal}/17 分，神经根及颈髓受累证据不足`;
    } else if (armVas <= 3) {
      neuroLine = `神经层面：伴轻度上肢放射痛/麻木（上肢 VAS ${armVas}），颈椎 JOA 评分 ${joaTotal}/17 分（${joaSeverity}），提示轻度颈神经根刺激或颈髓轻度受压恢复期`;
    } else if (armVas <= 6) {
      neuroLine = `神经层面：存在明确中度上肢放射性疼痛/麻木（上肢 VAS ${armVas}），颈椎 JOA 评分 ${joaTotal}/17 分（${joaSeverity}），提示相应节段颈神经根或脊髓受压征象明显`;
    } else {
      neuroLine = `神经层面：重度剧烈上肢放射痛（上肢 VAS ${armVas}），颈椎 JOA 评分 ${joaTotal}/17 分（${joaSeverity}），高度提示急性或重度颈神经根/脊髓受压，建议结合臂丛牵拉试验及颈椎MRI重点评估`;
    }

    return {
      physicalLine,
      mentalLine,
      neuroLine,
      fullText: `${physicalLine}\n${mentalLine}\n${neuroLine}`
    };
  }

  // 1. 腰椎疾病患者：躯体层面解读
  let backPainDesc = '无明显腰痛';
  if (backVas >= 7) backPainDesc = '重度腰痛';
  else if (backVas >= 4) backPainDesc = '中度腰痛';
  else if (backVas >= 1) backPainDesc = '轻度腰痛';

  let odiDesc = '轻度功能障碍';
  if (odiScore > 80) odiDesc = '完全功能残障/卧床状态';
  else if (odiScore > 60) odiDesc = '极重度功能障碍';
  else if (odiScore > 40) odiDesc = '重度功能障碍';
  else if (odiScore > 20) odiDesc = '中度功能障碍';
  else if (odiScore <= 10) odiDesc = '日常功能基本正常';

  let pcsDesc = '躯体健康维持良好';
  if (sf36.PCS < 35) pcsDesc = '躯体健康严重受损';
  else if (sf36.PCS < 43) pcsDesc = '躯体健康显著下降';
  else if (sf36.PCS < 48) pcsDesc = '躯体健康轻度下降';

  const physicalLine = `躯体层面：${backPainDesc}导致${odiDesc}（ODI ${odiScore}），${pcsDesc}（PCS ${sf36.PCS}）`;

  // 2. 心理与外观层面解读
  let mcsDesc = '情绪状态相对平稳';
  if (sf36.MCS < 38) mcsDesc = '存在明显焦虑或抑郁倾向';
  else if (sf36.MCS < 43) mcsDesc = '情绪状态轻度波动';
  else if (sf36.MCS >= 50) mcsDesc = '心理与情绪状态积极良好';

  let imageAnalysis = '';
  if (srs22Skipped) {
    imageAnalysis = '（非脊柱侧弯患者，已跳过 SRS-22 外观与脊柱畸形专项评估）';
  } else if (srs22.image <= 2.6) {
    imageAnalysis = `，但外观满意度极低（${srs22.image} 分），提示体态畸形或脊柱外观问题对患者心理影响较大`;
  } else if (srs22.image <= 3.4) {
    imageAnalysis = `，自我外观满意度一般（${srs22.image} 分），提示脊柱体态外观仍对患者自我形象有一定困扰`;
  } else {
    imageAnalysis = `，且躯干外观与自我形象满意度良好（${srs22.image} 分），患者对体态恢复自信度较高`;
  }

  const mentalLine = `心理层面：${mcsDesc}（MCS ${sf36.MCS}）${imageAnalysis}`;

  // 3. 神经层面解读
  let neuroLine = '';
  if (legVas === 0) {
    neuroLine = `神经层面：无下肢症状（腿 VAS 0），神经根受累证据不足`;
  } else if (legVas <= 3) {
    neuroLine = `神经层面：伴轻度下肢放射痛/麻木不适（腿 VAS ${legVas}），提示轻度神经根刺激或术后神经根水肿恢复期`;
  } else if (legVas <= 6) {
    neuroLine = `神经层面：存在明确中度下肢放射性疼痛（腿 VAS ${legVas}），提示坐骨神经或相应节段神经根受压/刺激征象明显`;
  } else {
    neuroLine = `神经层面：重度剧烈下肢放射痛（腿 VAS ${legVas}），高度提示急性或重度腰骶神经根受压，建议结合直腿抬高试验及MRI重点评估`;
  }

  return {
    physicalLine,
    mentalLine,
    neuroLine,
    fullText: `${physicalLine}\n${mentalLine}\n${neuroLine}`
  };
}

// ============================================================================
// 3. 预置典型临床病例数据库（含与用户示例完全一致的示范病例及历史随访曲线数据）
// ============================================================================

const INITIAL_PATIENTS = [
  {
    id: 'PT-2026-001',
    name: '林晓薇',
    gender: '女',
    age: 26,
    spineRegion: 'lumbar',
    hospitalId: 'ZY20260318',
    phone: '13800138661',
    diagnosis: '成人特发性脊柱侧凸伴腰背痛 (AIS / TL-Cobb 42°)',
    surgery: '后路脊柱矫形植骨融合内固定术（拟行/随访）',
    surgeryDate: '2026-06-15',
    records: [
      {
        recordId: 'REC-101',
        stage: '初诊基线 (6个月前)',
        date: '2026-05-10',
        backVas: 7,
        legVas: 1,
        odi: 38.0,
        pcs: 33.2,
        mcs: 41.5,
        srsImage: 2.0,
        srsTotal: 2.85,
        interpretation: '躯体层面：重度腰痛导致中度功能障碍（ODI 38.0），躯体健康严重受损（PCS 33.2）\n心理层面：情绪状态轻度波动（MCS 41.5），但外观满意度极低（2.0 分），提示体态畸形或脊柱外观问题对患者心理影响较大\n神经层面：伴轻度下肢放射痛/麻木不适（腿 VAS 1），提示轻度神经根刺激或术后神经根水肿恢复期'
      },
      {
        recordId: 'REC-102',
        stage: '术前1月复查',
        date: '2026-08-12',
        backVas: 6,
        legVas: 0,
        odi: 32.0,
        pcs: 35.4,
        mcs: 43.8,
        srsImage: 2.2,
        srsTotal: 3.05,
        interpretation: '躯体层面：中度腰痛导致中度功能障碍（ODI 32.0），躯体健康显著下降（PCS 35.4）\n心理层面：情绪状态相对平稳（MCS 43.8），但外观满意度极低（2.2 分），提示体态畸形或脊柱外观问题对患者心理影响较大\n神经层面：无下肢症状（腿 VAS 0），神经根受累证据不足'
      },
      {
        recordId: 'REC-103',
        stage: '本次术前评估',
        date: '2026-11-12',
        backVas: 5,
        legVas: 0,
        odi: 26.6,
        pcs: 37.7,
        mcs: 45.2,
        srsImage: 2.4,
        srsTotal: 3.32,
        interpretation: '躯体层面：中度腰痛导致中度功能障碍（ODI 26.6），躯体健康显著下降（PCS 37.7）\n心理层面：情绪状态相对平稳（MCS 45.2），但外观满意度极低（2.4 分），提示体态畸形或脊柱外观问题对患者心理影响较大\n神经层面：无下肢症状（腿 VAS 0），神经根受累证据不足'
      }
    ]
  },
  {
    id: 'PT-2026-002',
    name: '张建国',
    gender: '男',
    age: 58,
    spineRegion: 'lumbar',
    hospitalId: 'ZY20260109',
    phone: '13911223344',
    diagnosis: 'L4/5 腰椎间盘突出症伴右侧坐骨神经痛 (LDH)',
    surgery: 'UBE 单侧双通道脊柱内镜下髓核摘除神经根减压术',
    surgeryDate: '2026-07-20',
    records: [
      {
        recordId: 'REC-201',
        stage: '术前基线',
        date: '2026-07-18',
        backVas: 6,
        legVas: 8,
        odi: 56.0,
        pcs: 29.5,
        mcs: 39.2,
        srsImage: 3.2,
        srsTotal: 2.64,
        interpretation: '躯体层面：中度腰痛导致重度功能障碍（ODI 56.0），躯体健康严重受损（PCS 29.5）\n心理层面：情绪状态轻度波动（MCS 39.2），自我外观满意度一般（3.2 分），提示脊柱体态外观仍对患者自我形象有一定困扰\n神经层面：重度剧烈下肢放射痛（腿 VAS 8），高度提示急性或重度腰骶神经根受压，建议结合直腿抬高试验及MRI重点评估'
      },
      {
        recordId: 'REC-202',
        stage: '术后1周随访',
        date: '2026-07-27',
        backVas: 4,
        legVas: 3,
        odi: 34.0,
        pcs: 38.6,
        mcs: 46.5,
        srsImage: 3.8,
        srsTotal: 3.68,
        interpretation: '躯体层面：中度腰痛导致中度功能障碍（ODI 34.0），躯体健康显著下降（PCS 38.6）\n心理层面：情绪状态相对平稳（MCS 46.5），且躯干外观与自我形象满意度良好（3.8 分），患者对体态恢复自信度较高\n神经层面：伴轻度下肢放射痛/麻木不适（腿 VAS 3），提示轻度神经根刺激或术后神经根水肿恢复期'
      },
      {
        recordId: 'REC-203',
        stage: '术后1个月随访',
        date: '2026-08-22',
        backVas: 2,
        legVas: 1,
        odi: 18.0,
        pcs: 45.8,
        mcs: 51.2,
        srsImage: 4.2,
        srsTotal: 4.18,
        interpretation: '躯体层面：轻度腰痛导致轻度功能障碍（ODI 18.0），躯体健康轻度下降（PCS 45.8）\n心理层面：心理与情绪状态积极良好（MCS 51.2），且躯干外观与自我形象满意度良好（4.2 分），患者对体态恢复自信度较高\n神经层面：伴轻度下肢放射痛/麻木不适（腿 VAS 1），提示轻度神经根刺激或术后神经根水肿恢复期'
      }
    ]
  },
  {
    id: 'PT-2026-003',
    name: '陈淑芬',
    gender: '女',
    age: 64,
    spineRegion: 'lumbar',
    hospitalId: 'ZY20260452',
    phone: '13699887766',
    diagnosis: '退行性腰椎滑脱症伴椎管狭窄 (L4滑脱 I度)',
    surgery: 'MIS-TLIF 微创经椎间孔腰椎椎间融合术',
    surgeryDate: '2026-09-05',
    records: [
      {
        recordId: 'REC-301',
        stage: '术前基线',
        date: '2026-09-02',
        backVas: 7,
        legVas: 6,
        odi: 48.0,
        pcs: 31.8,
        mcs: 42.0,
        srsImage: 2.8,
        srsTotal: 2.91,
        interpretation: '躯体层面：重度腰痛导致重度功能障碍（ODI 48.0），躯体健康严重受损（PCS 31.8）\n心理层面：情绪状态轻度波动（MCS 42.0），自我外观满意度一般（2.8 分），提示脊柱体态外观仍对患者自我形象有一定困扰\n神经层面：存在明确中度下肢放射性疼痛（腿 VAS 6），提示坐骨神经或相应节段神经根受压/刺激征象明显'
      },
      {
        recordId: 'REC-302',
        stage: '术后1个月随访',
        date: '2026-10-06',
        backVas: 3,
        legVas: 2,
        odi: 24.0,
        pcs: 41.2,
        mcs: 48.4,
        srsImage: 3.6,
        srsTotal: 3.95,
        interpretation: '躯体层面：轻度腰痛导致中度功能障碍（ODI 24.0），躯体健康显著下降（PCS 41.2）\n心理层面：情绪状态相对平稳（MCS 48.4），且躯干外观与自我形象满意度良好（3.6 分），患者对体态恢复自信度较高\n神经层面：伴轻度下肢放射痛/麻木不适（腿 VAS 2），提示轻度神经根刺激或术后神经根水肿恢复期'
      }
    ]
  },
  {
    id: 'PT-2026-004',
    name: '赵志强',
    gender: '男',
    age: 52,
    spineRegion: 'cervical',
    hospitalId: 'ZY20260615',
    phone: '13766554433',
    diagnosis: '混合型颈椎病 (C5/6、C6/7 椎间盘突出伴颈髓及神经根受压)',
    surgery: 'ACDF 颈前路椎间盘切除减压植骨融合内固定术',
    surgeryDate: '2026-08-10',
    records: [
      {
        recordId: 'REC-401',
        spineRegion: 'cervical',
        stage: '术前基线',
        date: '2026-08-08',
        backVas: 6,
        legVas: 7,
        neckVas: 6,
        armVas: 7,
        joa: 11,
        ndi: 44.0,
        odi: 44.0,
        pcs: 34.2,
        mcs: 41.0,
        srsImage: '不适用',
        srsTotal: '不适用',
        interpretation: '躯体层面：中度颈部疼痛导致中度颈椎功能障碍（NDI 44.0），躯体健康严重受损（PCS 34.2）\n心理层面：情绪状态轻度波动（MCS 41.0），慢性颈肩不适及睡眠/阅读受限对患者日常精力具有一定影响\n神经层面：重度剧烈上肢放射痛（上肢 VAS 7），颈椎 JOA 评分 11/17 分（中度颈髓功能障碍），高度提示颈神经根/脊髓受压'
      },
      {
        recordId: 'REC-402',
        spineRegion: 'cervical',
        stage: '术后1个月随访',
        date: '2026-09-12',
        backVas: 3,
        legVas: 2,
        neckVas: 3,
        armVas: 2,
        joa: 15,
        ndi: 22.0,
        odi: 22.0,
        pcs: 43.5,
        mcs: 48.6,
        srsImage: '不适用',
        srsTotal: '不适用',
        interpretation: '躯体层面：轻度颈部疼痛导致轻度颈椎功能障碍（NDI 22.0），躯体健康轻度下降（PCS 43.5）\n心理层面：情绪状态相对平稳（MCS 48.6），慢性颈肩不适及睡眠/阅读受限明显改善\n神经层面：伴轻度上肢放射痛/麻木（上肢 VAS 2），颈椎 JOA 评分 15/17 分（轻度颈髓功能损害），提示神经功能稳步恢复'
      }
    ]
  }
];

// 生成能够精确算出示例结果（腰椎：ODI 26.6, PCS 37.7, MCS 45.2, 外观满意度 2.4, 腿VAS 0, 腰VAS 5；颈椎含JOA与NDI默认示范值）的默认问卷答案集
function getExamplePresetAnswers() {
  // ODI: 选9项（第8项性生活选skip），总分 12 / 45 = 26.66% -> 26.6
  const odi = {
    odi_1: 2,
    odi_2: 1,
    odi_3: 2,
    odi_4: 1,
    odi_5: 2,
    odi_6: 2,
    odi_7: 1,
    odi_8: 'skip',
    odi_9: 1,
    odi_10: 0
  };

  // 颈椎 JOA: 默认 14/17 分
  const joa = {
    joa_1: 3,
    joa_2: 3,
    joa_3: 1,
    joa_4: 2,
    joa_5: 2,
    joa_6: 3
  };

  // 颈椎 NDI: 选9项（第8项驾驶选skip），总分 12 / 45 = 26.6%
  const ndi = {
    ndi_1: 2,
    ndi_2: 1,
    ndi_3: 2,
    ndi_4: 2,
    ndi_5: 1,
    ndi_6: 1,
    ndi_7: 1,
    ndi_8: 'skip',
    ndi_9: 1,
    ndi_10: 1
  };

  // SF-36: 使得 PCS 约 37.7, MCS 约 45.2
  const sf36 = {
    sf_1: 3, sf_2: 3,
    sf_3a: 1, sf_3b: 2, sf_3c: 2, sf_3d: 2, sf_3e: 3,
    sf_3f: 1, sf_3g: 2, sf_3h: 2, sf_3i: 3, sf_3j: 3,
    sf_4a: 1, sf_4b: 1, sf_4c: 1, sf_4d: 2,
    sf_5a: 2, sf_5b: 2, sf_5c: 2,
    sf_6: 2, sf_7: 4, sf_8: 3, sf_10: 4,
    sf_9a: 3, sf_9b: 4, sf_9c: 5, sf_9d: 3, sf_9e: 4,
    sf_9f: 4, sf_9g: 3, sf_9h: 3, sf_9i: 3,
    sf_11a: 3, sf_11b: 3, sf_11c: 3, sf_11d: 3
  };

  // SRS-22: 使得 image (4,6,10,14,19) 平均分为 (2+2+2+3+3)/5 = 2.4 分
  const srs22 = {
    srs_1: 3, srs_2: 3, srs_3: 4, srs_4: 2, srs_5: 4,
    srs_6: 2, srs_7: 4, srs_8: 4, srs_9: 4, srs_10: 2,
    srs_11: 4, srs_12: 3, srs_13: 4, srs_14: 3, srs_15: 4,
    srs_16: 4, srs_17: 4, srs_18: 4, srs_19: 3, srs_20: 4,
    srs_21: 4, srs_22: 4
  };

  return { backVas: 5, legVas: 0, neckVas: 4, armVas: 2, odi, joa, ndi, sf36, srs22 };
}

// ============================================================================
// 4. SVG 双曲线图组件：疼痛 VAS 随访历史变化趋势（自适应腰椎/颈椎双分支）
// ============================================================================
function VasHistoryChart({ records, spineRegion = 'lumbar' }) {
  const isCervical = spineRegion === 'cervical';
  const primaryLabel = isCervical ? '颈部疼痛 VAS' : '腰部疼痛 VAS';
  const secondaryLabel = isCervical ? '上肢疼痛 VAS（臂痛/麻）' : '下肢疼痛 VAS（腿痛）';
  const primaryShort = isCervical ? '颈' : '腰';
  const secondaryShort = isCervical ? '臂' : '腿';

  const width = 760;
  const height = 290;
  const padLeft = 52;
  const padRight = 36;
  const padTop = 34;
  const padBottom = 54;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const safeRecords = records && records.length > 0 ? records : [];

  const getX = (idx) => {
    if (safeRecords.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (safeRecords.length - 1)) * plotW;
  };

  const getY = (vas) => {
    const clamped = Math.max(0, Math.min(10, Number(vas || 0)));
    return padTop + plotH - (clamped / 10) * plotH;
  };

  const getPrimaryVas = (r) => (isCervical ? (r.neckVas ?? r.backVas ?? 0) : (r.backVas ?? 0));
  const getSecondaryVas = (r) => (isCervical ? (r.armVas ?? r.legVas ?? 0) : (r.legVas ?? 0));

  const backPoints = safeRecords.map((r, i) => `${getX(i)},${getY(getPrimaryVas(r))}`).join(' ');
  const legPoints = safeRecords.map((r, i) => `${getX(i)},${getY(getSecondaryVas(r))}`).join(' ');

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-indigo-600" />
            {primaryLabel} 与 {secondaryLabel} 随访历史变化曲线图
          </h4>
          <p className="text-xs text-slate-500">
            横轴为随访时间节点（术前及术后各期），纵轴为疼痛视觉模拟评分（0~10分）
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
            {primaryLabel}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            {secondaryLabel}
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[480px]">
          {/* 背景严重程度分区带 */}
          <rect x={padLeft} y={getY(10)} width={plotW} height={getY(7) - getY(10)} fill="#fef2f2" opacity="0.55" />
          <rect x={padLeft} y={getY(7)} width={plotW} height={getY(4) - getY(7)} fill="#fffbeb" opacity="0.55" />
          <rect x={padLeft} y={getY(4)} width={plotW} height={getY(0) - getY(4)} fill="#f0fdf4" opacity="0.55" />

          {/* 水平网格线 (0, 2, 4, 6, 8, 10) */}
          {[0, 2, 4, 6, 8, 10].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={val === 0 ? '' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-500 font-medium"
                >
                  {val}分
                </text>
              </g>
            );
          })}

          {/* 右侧临床分区提示 */}
          <text x={width - padRight - 6} y={getY(8.5)} textAnchor="end" className="text-[10px] fill-rose-400">重度痛区 (7-10)</text>
          <text x={width - padRight - 6} y={getY(5.5)} textAnchor="end" className="text-[10px] fill-amber-500">中度痛区 (4-6)</text>
          <text x={width - padRight - 6} y={getY(2.0)} textAnchor="end" className="text-[10px] fill-emerald-500">轻/无痛区 (0-3)</text>

          {/* 折线连接 */}
          {safeRecords.length > 1 && (
            <>
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={backPoints}
              />
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={legPoints}
              />
            </>
          )}

          {/* 数据点与数值标注 */}
          {safeRecords.map((rec, i) => {
            const x = getX(i);
            const pVal = getPrimaryVas(rec);
            const sVal = getSecondaryVas(rec);
            const yBack = getY(pVal);
            const yLeg = getY(sVal);
            const isLatest = i === safeRecords.length - 1;
            const sameVal = Number(pVal) === Number(sVal);

            return (
              <g key={rec.recordId || i}>
                {/* 垂直参考线 */}
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={height - padBottom}
                  stroke={isLatest ? '#cbd5e1' : '#f1f5f9'}
                  strokeWidth={isLatest ? '1.5' : '1'}
                />

                {/* 轴向痛（腰/颈）数据点 */}
                <circle
                  cx={x}
                  cy={yBack}
                  r={isLatest ? 6 : 5}
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={yBack - 10}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-indigo-700"
                >
                  {primaryShort} {pVal}
                </text>

                {/* 四肢放射痛（腿/臂）数据点 */}
                <circle
                  cx={x}
                  cy={yLeg}
                  r={isLatest ? 6 : 5}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={sameVal ? yLeg + 18 : yLeg + 16}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-emerald-700"
                >
                  {secondaryShort} {sVal}
                </text>

                {/* X轴随访阶段与日期 */}
                <text
                  x={x}
                  y={height - padBottom + 20}
                  textAnchor="middle"
                  className={`text-[11px] ${isLatest ? 'fill-indigo-700 font-bold' : 'fill-slate-700 font-medium'}`}
                >
                  {rec.stage}
                </text>
                <text
                  x={x}
                  y={height - padBottom + 36}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400"
                >
                  {rec.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// 5. 主应用组件
// ============================================================================
// 本地日期 YYYY-MM-DD（不用 toISOString，避免东八区凌晨显示成前一天）
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 空白问卷：真实患者从头作答
const getBlankAnswers = () => ({
  backVas: 0,
  legVas: 0,
  neckVas: 0,
  armVas: 0,
  odi: {},
  joa: {},
  ndi: {},
  sf36: {},
  srs22: {}
});

export default function SpineFollowUpApp({ role, me, onSignOut, qrToken }) {
  const isDoctor = role === 'doctor';
  const isQr = role === 'qr';
  // 疾病部位分支状态：'lumbar' (我是腰椎疾病患者) | 'cervical' (我是颈椎疾病患者)
  const [spineRegion, setSpineRegion] = useState('lumbar');

  // 横向步骤定义（根据患者选择的“腰椎疾病”或“颈椎疾病”动态切换问卷序列）:
  // 0: 病例建档/检索
  // 1: 疾病分支选择（我是颈椎疾病患者 vs 我是腰椎疾病患者）
  // 2~5: 对应分支的4套核心量表
  // 6: 随访结果解读与历史变化曲线
  const STEPS = useMemo(() => {
    const all =
      spineRegion === 'cervical'
        ? [
            { id: 0, title: '病例建档/检索', sub: '选择或新建患者', icon: Users },
            { id: 1, title: '疾病类型选择', sub: '当前：颈椎疾病患者', icon: Stethoscope },
            { id: 2, title: '颈痛/上肢痛 VAS', sub: '可视化表情评分', icon: Activity },
            { id: 3, title: '颈椎 JOA 评分', sub: '完整17分法脊髓评估', icon: ShieldAlert },
            { id: 4, title: 'NDI 评分问卷', sub: '完整10项颈椎功能障碍', icon: ClipboardList },
            { id: 5, title: 'SF-36 健康问卷', sub: '完整36项 PCS/MCS', icon: HeartPulse },
            { id: 6, title: '随访结果解读', sub: '历史曲线与报告', icon: FileText }
          ]
        : [
            { id: 0, title: '病例建档/检索', sub: '选择或新建患者', icon: Users },
            { id: 1, title: '疾病类型选择', sub: '当前：腰椎疾病患者', icon: Stethoscope },
            { id: 2, title: '腰/腿痛 VAS', sub: '可视化表情评分', icon: Activity },
            { id: 3, title: 'ODI 评分问卷', sub: '完整10项功能障碍', icon: ClipboardList },
            { id: 4, title: 'SF-36 健康问卷', sub: '完整36项 PCS/MCS', icon: HeartPulse },
            { id: 5, title: 'SRS-22 脊柱问卷', sub: '完整22项外观/心理', icon: Brain },
            { id: 6, title: '随访结果解读', sub: '历史曲线与报告', icon: FileText }
          ];
    // 患者不检索病例，疾病部位取自医生建档时的设置，所以直接从疼痛评分开始
    return isDoctor ? all : all.filter((s) => s.id >= 2);
  }, [spineRegion, isDoctor]);
  const firstStepId = STEPS[0].id;

  const [currentStep, setCurrentStep] = useState(isDoctor ? 0 : 2);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [followUpStage, setFollowUpStage] = useState('术后3个月随访');
  const [followUpDate, setFollowUpDate] = useState(todayStr());

  // 检索与新建病例状态
  const [searchQuery, setSearchQuery] = useState('');
  const [caseTab, setCaseTab] = useState('search'); // 'search' | 'create'
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    gender: '女',
    age: '',
    spineRegion: 'lumbar',
    hospitalId: '',
    phone: '',
    email: '',
    diagnosis: '',
    surgery: '',
    surgeon: '',
    surgeryDate: ''
  });

  // 问卷作答状态（支持腰椎与颈椎全套问卷）
  const preset = useMemo(() => getBlankAnswers(), []);
  const [backVas, setBackVas] = useState(preset.backVas);
  const [legVas, setLegVas] = useState(preset.legVas);
  const [neckVas, setNeckVas] = useState(preset.neckVas);
  const [armVas, setArmVas] = useState(preset.armVas);
  const [odiAnswers, setOdiAnswers] = useState(preset.odi);
  const [joaAnswers, setJoaAnswers] = useState(preset.joa);
  const [ndiAnswers, setNdiAnswers] = useState(preset.ndi);
  const [sf36Answers, setSf36Answers] = useState(preset.sf36);
  const [srs22Answers, setSrs22Answers] = useState(preset.srs22);
  const [srs22Skipped, setSrs22Skipped] = useState(false);

  // 各大问卷内部横向子分页索引（让患者在横向屏幕下每页专注填写少量题目）
  const [odiPage, setOdiPage] = useState(0); // 2页，每页5题
  const [ndiPage, setNdiPage] = useState(0); // 2页，每页5题
  const [sf36GroupIdx, setSf36GroupIdx] = useState(0); // 6个维度组
  const [srs22Page, setSrs22Page] = useState(0); // 3页 (8题 + 8题 + 6题)

  // 保存与复制反馈状态
  const [copiedReport, setCopiedReport] = useState(false);
  const [savedToast, setSavedToast] = useState('');
  const [customInterpretation, setCustomInterpretation] = useState('');
  const [isEditingInterpretation, setIsEditingInterpretation] = useState(false);

  // 隐私保护：登录的医生可以直接切换显示/隐藏；删除操作弹窗二次确认（不再使用写死在前端的管理员密码）
  const [isInfoUnlocked, setIsInfoUnlocked] = useState(false);
  const [hideLivePreviewPoint, setHideLivePreviewPoint] = useState(false);
  const [adminModal, setAdminModal] = useState({
    open: false,
    actionType: '', // 'delete_patient' | 'delete_record'
    title: '',
    description: '',
    payload: null,
    errorMsg: ''
  });
  const [qrModal, setQrModal] = useState({ open: false, dataUrl: '', patient: null });
  // 患者首次登录自助建档表单
  const [selfRegForm, setSelfRegForm] = useState({ name: '', gender: '女', age: '', spineRegion: 'lumbar', diagnosis: '' });

  // 隐私字段脱敏辅助函数（仅保留姓名、年龄、病案号，其余显示为 *）
  // 患者看自己的档案时不脱敏
  const maskField = (val, maskLength = 6) => {
    if (isInfoUnlocked || !isDoctor) return val;
    return '*'.repeat(maskLength);
  };

  const flashToast = (msg, ms = 3000) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(''), ms);
  };

  // 打开删除确认弹窗
  const openAdminAuthModal = ({ actionType, title, description, payload = null }) => {
    setAdminModal({
      open: true,
      actionType,
      title,
      description,
      payload,
      errorMsg: ''
    });
  };

  const closeAdminAuthModal = () => {
    setAdminModal((prev) => ({ ...prev, open: false, errorMsg: '' }));
  };

  // 从云端载入病例：医生拿到全部患者，患者只拿到自己的档案（由数据库行级权限过滤）
  const reloadPatients = async ({ keepSelection = true } = {}) => {
    setPatientsLoading(true);
    setLoadError('');
    try {
      const loaded = await api.loadPatients();
      setPatients(loaded);
      setSelectedPatientId((prev) => (keepSelection && loaded.some((p) => p.id === prev) ? prev : loaded[0]?.id || ''));
      if (!isDoctor && loaded[0]) {
        setSpineRegion(loaded[0].spineRegion || 'lumbar');
      }
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    if (isQr) {
      // 扫码患者：用 token 直接读取自己的档案，不走登录态
      setPatientsLoading(true);
      setLoadError('');
      (async () => {
        try {
          const loaded = await api.patientByToken(qrToken);
          if (!loaded) {
            setLoadError('二维码链接无效或已过期，请联系医生重新获取');
          } else {
            setPatients([loaded]);
            setSelectedPatientId(loaded.id);
            setSpineRegion(loaded.spineRegion || 'lumbar');
          }
        } catch (e) {
          setLoadError(e.message);
        } finally {
          setPatientsLoading(false);
        }
      })();
      return;
    }
    reloadPatients({ keepSelection: false });
  }, []);

  // 从数据库彻底删除指定病例
  const removePatientFromDatabase = async (patientId) => {
    const target = patients.find((p) => p.id === patientId);
    await api.deletePatient(patientId);
    setPatients((prev) => {
      const remaining = prev.filter((p) => p.id !== patientId);
      setSelectedPatientId((sel) => (sel === patientId ? remaining[0]?.id || '' : sel));
      return remaining;
    });
    flashToast(`已删除患者【${target?.name || patientId}】的病例档案`);
  };

  // 删除某一次具体的随访时间点记录
  const removeFollowUpRecord = async (patientId, recordId) => {
    if (recordId === 'LIVE-CURRENT') {
      setHideLivePreviewPoint(true);
      flashToast('已从当前随访曲线与时间点列表中移除本次未归档记录');
      return;
    }

    const targetRec = patients.find((p) => p.id === patientId)?.records?.find((r) => r.recordId === recordId);
    await api.deleteRecord(recordId);
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, records: (p.records || []).filter((r) => r.recordId !== recordId) } : p))
    );
    flashToast(`已删除随访时间点记录：【${targetRec?.stage || ''} (${targetRec?.date || ''})】`);
  };

  // 确认删除弹窗：执行对应操作，失败时在弹窗内提示
  const handleAdminAuthSubmit = async (e) => {
    e.preventDefault();
    const { actionType, payload } = adminModal;
    setIsSaving(true);
    try {
      if (actionType === 'delete_patient' && payload?.patientId) {
        await removePatientFromDatabase(payload.patientId);
      } else if (actionType === 'delete_record' && payload?.patientId && payload?.recordId) {
        await removeFollowUpRecord(payload.patientId, payload.recordId);
      }
      closeAdminAuthModal();
    } catch (err) {
      setAdminModal((prev) => ({ ...prev, errorMsg: err.message }));
    } finally {
      setIsSaving(false);
    }
  };

  // 生成扫码登录二维码：扫码打开网站，患者用建档时登记的手机号收验证码登录
  const openPatientQr = async (patient) => {
    try {
      const token = await api.setPatientToken(patient.id);
      const url = `${window.location.origin}/?token=${token}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2 });
      setQrModal({ open: true, dataUrl, patient, url });
    } catch (err) {
      flashToast(err.message, 5000);
    }
  };

  // 当前选中的患者对象
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // 检索过滤病例列表
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.name, p.hospitalId, p.phone, p.email, p.diagnosis].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  // 实时计算全部评分结果
  const odiScore = useMemo(() => calculateODI(odiAnswers), [odiAnswers]);
  const joaResult = useMemo(() => calculateJOA(joaAnswers), [joaAnswers]);
  const ndiScore = useMemo(() => calculateNDI(ndiAnswers), [ndiAnswers]);
  const sf36Result = useMemo(() => calculateSF36(sf36Answers), [sf36Answers]);
  const srs22Result = useMemo(() => calculateSRS22(srs22Answers), [srs22Answers]);

  const clinicalInterpretation = useMemo(() => {
    return generateClinicalInterpretation({
      spineRegion,
      backVas,
      legVas,
      odiScore,
      neckVas,
      armVas,
      joaResult,
      ndiScore,
      sf36: sf36Result,
      srs22: srs22Result,
      srs22Skipped
    });
  }, [spineRegion, backVas, legVas, odiScore, neckVas, armVas, joaResult, ndiScore, sf36Result, srs22Result, srs22Skipped]);

  // 当临床自动解读变化且未处于手动覆盖模式时同步文本
  useEffect(() => {
    if (!isEditingInterpretation) {
      setCustomInterpretation(clinicalInterpretation.fullText);
    }
  }, [clinicalInterpretation, isEditingInterpretation]);

  // 包含历史记录 + 本次实时评估点的曲线数据
  const combinedHistoryRecords = useMemo(() => {
    const baseRecords = selectedPatient?.records || [];
    if (hideLivePreviewPoint) {
      return baseRecords;
    }
    const currentLiveRecord = {
      recordId: 'LIVE-CURRENT',
      spineRegion,
      stage: `${followUpStage}(本次)`,
      date: followUpDate,
      backVas: spineRegion === 'cervical' ? neckVas : backVas,
      legVas: spineRegion === 'cervical' ? armVas : legVas,
      neckVas,
      armVas,
      odi: spineRegion === 'cervical' ? ndiScore : odiScore,
      ndi: ndiScore,
      joa: joaResult.total,
      pcs: sf36Result.PCS,
      mcs: sf36Result.MCS,
      srsImage: spineRegion === 'cervical' ? '不适用' : (srs22Skipped ? '已跳过' : srs22Result.image),
      srsTotal: spineRegion === 'cervical' ? '不适用' : (srs22Skipped ? '已跳过' : srs22Result.total),
      interpretation: customInterpretation || clinicalInterpretation.fullText
    };
    return [...baseRecords, currentLiveRecord];
  }, [
    selectedPatient,
    hideLivePreviewPoint,
    spineRegion,
    followUpStage,
    followUpDate,
    backVas,
    legVas,
    neckVas,
    armVas,
    odiScore,
    ndiScore,
    joaResult,
    sf36Result,
    srs22Result,
    srs22Skipped,
    customInterpretation,
    clinicalInterpretation
  ]);

  // 问卷完成度统计
  const odiCompletedCount = useMemo(() => {
    return ODI_QUESTIONS.filter((q) => odiAnswers[q.id] !== undefined).length;
  }, [odiAnswers]);

  const joaCompletedCount = useMemo(() => {
    return CERVICAL_JOA_QUESTIONS.filter((q) => joaAnswers[q.id] !== undefined).length;
  }, [joaAnswers]);

  const ndiCompletedCount = useMemo(() => {
    return NDI_QUESTIONS.filter((q) => ndiAnswers[q.id] !== undefined).length;
  }, [ndiAnswers]);

  const sf36CompletedCount = useMemo(() => {
    const allIds = SF36_GROUPS.flatMap((g) => g.questions.map((q) => q.id));
    return allIds.filter((id) => sf36Answers[id] !== undefined).length;
  }, [sf36Answers]);

  const srs22CompletedCount = useMemo(() => {
    return SRS22_QUESTIONS.filter((q) => srs22Answers[q.id] !== undefined).length;
  }, [srs22Answers]);

  // 患者首次登录、还没有档案：自己填写基本信息建档，然后直接开始填问卷
  const handleSelfRegister = async (e) => {
    e.preventDefault();
    if (!selfRegForm.name.trim()) {
      flashToast('请填写您的姓名', 2500);
      return;
    }
    if (!Number(selfRegForm.age)) {
      flashToast('请填写您的年龄', 2500);
      return;
    }
    setIsSaving(true);
    try {
      const created = await api.registerSelf(
        {
          name: selfRegForm.name.trim(),
          gender: selfRegForm.gender,
          age: selfRegForm.age,
          spineRegion: selfRegForm.spineRegion,
          diagnosis: selfRegForm.diagnosis.trim()
        },
        me
      );
      setPatients([created]);
      setSelectedPatientId(created.id);
      setSpineRegion(created.spineRegion);
      setCurrentStep(2);
      flashToast('建档成功，请开始填写问卷');
    } catch (err) {
      flashToast(err.message, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // 新建患者提交（编号由数据库生成）
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientForm.name.trim()) {
      flashToast('请填写患者姓名', 2500);
      return;
    }
    const email = newPatientForm.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      flashToast('患者邮箱格式不正确', 2500);
      return;
    }
    setIsSaving(true);
    try {
      const created = await api.createPatient({
        name: newPatientForm.name.trim(),
        gender: newPatientForm.gender,
        age: newPatientForm.age,
        spineRegion: newPatientForm.spineRegion || 'lumbar',
        hospitalId: newPatientForm.hospitalId.trim(),
        phone: newPatientForm.phone.trim(),
        email,
        diagnosis: newPatientForm.diagnosis.trim(),
        surgery: newPatientForm.surgery.trim(),
        surgeon: newPatientForm.surgeon.trim(),
        surgeryDate: newPatientForm.surgeryDate
      });
      setPatients((prev) => [created, ...prev]);
      setSelectedPatientId(created.id);
      setSpineRegion(created.spineRegion);
      setFollowUpStage('术前基线评估');
      setCaseTab('search');
      setNewPatientForm((f) => ({ ...f, name: '', age: '', hospitalId: '', phone: '', email: '', diagnosis: '', surgery: '', surgeon: '', surgeryDate: '' }));
      flashToast(`已成功建档并选中患者：${created.name}`);
    } catch (err) {
      flashToast(err.message, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // 保存本次随访记录到当前病例历史库（医生“归档”，患者“提交”）
  const handleSaveFollowUpRecord = async () => {
    if (!selectedPatient || isSaving) return;
    const newRec = {
      spineRegion,
      stage: followUpStage,
      date: followUpDate,
      backVas: spineRegion === 'cervical' ? neckVas : backVas,
      legVas: spineRegion === 'cervical' ? armVas : legVas,
      neckVas,
      armVas,
      odi: spineRegion === 'cervical' ? ndiScore : odiScore,
      ndi: ndiScore,
      joa: joaResult.total,
      pcs: sf36Result.PCS,
      mcs: sf36Result.MCS,
      srsImage: spineRegion === 'cervical' ? '不适用' : (srs22Skipped ? '已跳过' : srs22Result.image),
      srsTotal: spineRegion === 'cervical' ? '不适用' : (srs22Skipped ? '已跳过' : srs22Result.total),
      interpretation: customInterpretation || clinicalInterpretation.fullText
    };
    // 原始作答也存档，便于日后复核或重新计分
    const answers =
      spineRegion === 'cervical'
        ? { neckVas, armVas, joa: joaAnswers, ndi: ndiAnswers, sf36: sf36Answers }
        : { backVas, legVas, odi: odiAnswers, sf36: sf36Answers, srs22: srs22Skipped ? null : srs22Answers, srs22Skipped };

    setIsSaving(true);
    try {
      if (isDoctor && selectedPatient.spineRegion !== spineRegion) {
        await api.updatePatientRegion(selectedPatient.id, spineRegion);
      }
      let saved;
      if (isQr) {
        const res = await api.patientSubmit(qrToken, newRec, answers);
        saved = { ...newRec, recordId: res.recordId, submittedRole: 'patient' };
      } else {
        saved = await api.addRecord(selectedPatient.id, newRec, answers, role, me.uid);
      }
      setPatients((prev) =>
        prev.map((p) => (p.id === selectedPatient.id ? { ...p, spineRegion, records: [...(p.records || []), saved] } : p))
      );
      setHideLivePreviewPoint(true);
      flashToast(
        isDoctor
          ? `已将【${selectedPatient.name} - ${followUpStage}】随访结果存入病例数据库！`
          : '提交成功！您的医生已可以看到本次评估结果。',
        3500
      );
    } catch (err) {
      flashToast(err.message, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // 一键载入典型示范数据或清空问卷重新作答
  const handleLoadExampleCase = () => {
    const ex = getExamplePresetAnswers();
    setBackVas(ex.backVas);
    setLegVas(ex.legVas);
    setNeckVas(ex.neckVas);
    setArmVas(ex.armVas);
    setOdiAnswers(ex.odi);
    setJoaAnswers(ex.joa);
    setNdiAnswers(ex.ndi);
    setSf36Answers(ex.sf36);
    setSrs22Answers(ex.srs22);
    setSrs22Skipped(false);
    setHideLivePreviewPoint(false);
    setIsEditingInterpretation(false);
    setSavedToast(
      spineRegion === 'cervical'
        ? '已载入颈椎示范数据（颈VAS 4 / 上肢VAS 2 / JOA 14分 / NDI 26.6% / PCS 37.7 / MCS 45.2）'
        : '已载入腰椎示范数据（腰VAS 5 / 腿VAS 0 / ODI 26.6% / PCS 37.7 / MCS 45.2 / 外观 2.4）'
    );
    setTimeout(() => setSavedToast(''), 3000);
  };

  const handleResetBlankQuestionnaire = () => {
    setBackVas(0);
    setLegVas(0);
    setNeckVas(0);
    setArmVas(0);
    setOdiAnswers({});
    setJoaAnswers({});
    setNdiAnswers({});
    setSf36Answers({});
    setSrs22Answers({});
    setSrs22Skipped(false);
    setOdiPage(0);
    setNdiPage(0);
    setSf36GroupIdx(0);
    setSrs22Page(0);
    setHideLivePreviewPoint(false);
    setIsEditingInterpretation(false);
    setSavedToast('问卷已重置为空白状态，可供患者从头逐项作答');
    setTimeout(() => setSavedToast(''), 3000);
  };

  // 复制临床结果报告到剪贴板
  const handleCopyReport = () => {
    const reportLines =
      spineRegion === 'cervical'
        ? [
            `【脊柱外科随访评估报告 · 颈椎疾病分支】`,
            `患者姓名：${selectedPatient?.name} (${maskField(selectedPatient?.gender, 1)}, ${selectedPatient?.age}岁) | 病案号：${selectedPatient?.hospitalId}`,
            `临床诊断：${maskField(selectedPatient?.diagnosis, 8)}`,
            `随访节点：${followUpStage} (${followUpDate})`,
            `----------------------------------------`,
            `1. 疼痛VAS评分：颈部疼痛 VAS ${neckVas} 分 | 上肢疼痛 VAS ${armVas} 分`,
            `2. 颈椎JOA脊髓功能评分：${joaResult.total} / 17 分 (上肢运动:${joaResult.motorUpper} 下肢运动:${joaResult.motorLower} 感觉:${joaResult.sensoryTotal} 膀胱:${joaResult.bladder})`,
            `3. NDI颈椎功能障碍指数：${ndiScore}%`,
            `4. SF-36健康调查：PCS(躯体健康总评) ${sf36Result.PCS} | MCS(精神健康总评) ${sf36Result.MCS}`,
            `   (PF:${sf36Result.PF} RP:${sf36Result.RP} BP:${sf36Result.BP} GH:${sf36Result.GH} VT:${sf36Result.VT} SF:${sf36Result.SF} RE:${sf36Result.RE} MH:${sf36Result.MH})`,
            `----------------------------------------`,
            `【临床分层结果解读】`,
            customInterpretation || clinicalInterpretation.fullText
          ]
        : [
            `【脊柱外科随访评估报告 · 腰椎疾病分支】`,
            `患者姓名：${selectedPatient?.name} (${maskField(selectedPatient?.gender, 1)}, ${selectedPatient?.age}岁) | 病案号：${selectedPatient?.hospitalId}`,
            `临床诊断：${maskField(selectedPatient?.diagnosis, 8)}`,
            `随访节点：${followUpStage} (${followUpDate})`,
            `----------------------------------------`,
            `1. 疼痛VAS评分：腰部疼痛 VAS ${backVas} 分 | 下肢疼痛 VAS ${legVas} 分`,
            `2. ODI功能障碍指数：${odiScore}%`,
            `3. SF-36健康调查：PCS(躯体健康总评) ${sf36Result.PCS} | MCS(精神健康总评) ${sf36Result.MCS}`,
            `   (PF:${sf36Result.PF} RP:${sf36Result.RP} BP:${sf36Result.BP} GH:${sf36Result.GH} VT:${sf36Result.VT} SF:${sf36Result.SF} RE:${sf36Result.RE} MH:${sf36Result.MH})`,
            srs22Skipped
              ? `4. SRS-22脊柱评分：患者非脊柱侧弯患者，已跳过该部分`
              : `4. SRS-22脊柱评分：总均分 ${srs22Result.total} 分 (功能:${srs22Result.function} 疼痛:${srs22Result.pain} 外观满意度:${srs22Result.image} 心理:${srs22Result.mental} 治疗满意:${srs22Result.satisfaction})`,
            `----------------------------------------`,
            `【临床分层结果解读】`,
            customInterpretation || clinicalInterpretation.fullText
          ];

    const reportText = reportLines.join('\n');
    const textArea = document.createElement('textarea');
    textArea.value = reportText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const currentBackVasInfo = VAS_LEVELS[backVas] || VAS_LEVELS[0];
  const currentLegVasInfo = VAS_LEVELS[legVas] || VAS_LEVELS[0];
  const currentNeckVasInfo = VAS_LEVELS[neckVas] || VAS_LEVELS[0];
  const currentArmVasInfo = VAS_LEVELS[armVas] || VAS_LEVELS[0];

  // 判断当前步骤对应哪个具体模块：
  // Step 0: 病例建档/检索
  // Step 1: 疾病部位分支选择（我是颈椎疾病患者 vs 我是腰椎疾病患者）
  // Step 2: VAS 疼痛评分（腰椎为腰/腿痛VAS，颈椎为颈痛/上肢痛VAS）
  // 腰椎分支：Step 3 = ODI, Step 4 = SF-36, Step 5 = SRS-22, Step 6 = 结果解读
  // 颈椎分支：Step 3 = 颈椎JOA, Step 4 = NDI, Step 5 = SF-36, Step 6 = 结果解读
  const isSf36Step =
    (spineRegion === 'lumbar' && currentStep === 4) ||
    (spineRegion === 'cervical' && currentStep === 5);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* 顶部全局横向导航与步骤进度条 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* 左侧品牌与当前患者状态 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  脊柱外科患者随访与量表评估小程序
                </h1>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  {spineRegion === 'cervical' ? '颈椎疾病评估通道' : '腰椎疾病评估通道'}
                </span>
              </div>
              {selectedPatient && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-700">
                    当前患者：{selectedPatient.name}（{maskField(selectedPatient.gender, 1)} · {selectedPatient.age}岁）
                  </span>
                  <span>|</span>
                  <span>病案号：{selectedPatient.hospitalId}</span>
                  <span>|</span>
                  <span className="text-indigo-600 font-medium">{followUpStage}</span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧快捷功能按钮 */}
          <div className="flex flex-wrap items-center gap-2">
            {isDoctor && (
            <button
              onClick={() => {
                setIsInfoUnlocked(!isInfoUnlocked);
                flashToast(isInfoUnlocked ? '已恢复患者隐私信息隐藏保护模式' : '已显示患者全部信息，离开前请记得隐藏', 2500);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                isInfoUnlocked
                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700'
              }`}
            >
              {isInfoUnlocked ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  隐藏隐私信息
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  显示所有信息
                </>
              )}
            </button>
            )}
            {isDoctor && import.meta.env.DEV && (
            <button
              onClick={handleLoadExampleCase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200"
              title="载入标准临床示范数据（仅本地开发可见）"
            >
              <Sparkles className="w-3.5 h-3.5" />
              载入示范评估数据
            </button>
            )}
            <button
              onClick={handleResetBlankQuestionnaire}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              title="清空当前问卷从头填写"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置空白问卷
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              title={isDoctor ? '医生账号' : me.phone || ''}
            >
              <LogOut className="w-3.5 h-3.5" />
              退出{isDoctor ? '（医生）' : ''}
            </button>
          </div>
        </div>

        {/* 横向分步流程导航条 */}
        <div className="bg-slate-50/80 border-t border-slate-200/80">
          <div className="max-w-[1440px] mx-auto px-4 py-2 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[780px] gap-2">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = currentStep === s.id;
                const isPast = currentStep > s.id;
                return (
                  <React.Fragment key={s.id}>
                    <button
                      onClick={() => setCurrentStep(s.id)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all text-left flex-1 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                          : isPast
                          ? 'bg-emerald-50/90 text-emerald-900 border border-emerald-200 hover:bg-emerald-100/70'
                          : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : isPast
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isPast ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {idx + 1}. {s.title}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-indigo-100' : isPast ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {s.sub}
                        </div>
                      </div>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* 顶部全局消息提示 */}
      {savedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* 横向主工作区 */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-4 py-4 flex flex-col justify-between">
        {(patientsLoading || loadError || (!isDoctor && !selectedPatient)) && (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-sm space-y-3 text-center">
              {patientsLoading ? (
                <p className="text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在从云端载入病例…
                </p>
              ) : loadError ? (
                <>
                  <p className="text-rose-600 font-semibold">{loadError}</p>
                  <button
                    onClick={() => (isQr ? window.location.replace(window.location.origin + '/') : reloadPatients())}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isQr ? '返回登录页' : '重新载入'}
                  </button>
                </>
              ) : !me.phone ? (
                <>
                  <p className="font-bold text-slate-800">没有取到您的登录手机号</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    请退出后，在登录页用邮箱接收验证码重新登录。
                  </p>
                  <button onClick={onSignOut} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                    退出并重新登录
                  </button>
                </>
              ) : (
                <form onSubmit={handleSelfRegister} className="space-y-3 text-left">
                  <div className="text-center">
                    <p className="font-bold text-slate-800">首次使用，请先建立您的随访档案</p>
                    <p className="text-xs text-slate-500 mt-1">登录手机号：{me.phone}。档案建好后即可开始填写问卷，以后用这个手机号登录就能看到历次结果。</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">姓名 *</label>
                    <input
                      value={selfRegForm.name}
                      onChange={(e) => setSelfRegForm({ ...selfRegForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">性别</label>
                      <select
                        value={selfRegForm.gender}
                        onChange={(e) => setSelfRegForm({ ...selfRegForm, gender: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="女">女</option>
                        <option value="男">男</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">年龄 *</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="120"
                        value={selfRegForm.age}
                        onChange={(e) => setSelfRegForm({ ...selfRegForm, age: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">您的不适主要在哪个部位？ *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'lumbar', label: '腰椎（腰/腿）' },
                        { value: 'cervical', label: '颈椎（颈/上肢）' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelfRegForm({ ...selfRegForm, spineRegion: opt.value })}
                          className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                            selfRegForm.spineRegion === opt.value
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">医生告诉您的诊断（选填）</label>
                    <input
                      value={selfRegForm.diagnosis}
                      onChange={(e) => setSelfRegForm({ ...selfRegForm, diagnosis: e.target.value })}
                      placeholder="如：腰椎间盘突出症"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button type="button" onClick={onSignOut} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                      换个手机号
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                      建档并开始填写
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {!patientsLoading && !loadError && (isDoctor || selectedPatient) && (<>
        {/* ================================================================
            第 0 步：病例数据库检索 / 新建病例模块（横向双栏布局）
           ================================================================ */}
        {isDoctor && currentStep === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 左栏：搜索已录入病例 或 新建患者档案 (7列) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      病例数据库：查找已有档案或新建患者
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      患者填写前可先通过姓名、病案号或手机号检索本人档案，首次就诊可直接新建病例
                    </p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setCaseTab('search')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        caseTab === 'search'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      检索已录入病例 ({patients.length})
                    </button>
                    <button
                      onClick={() => setCaseTab('create')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        caseTab === 'create'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      新建患者病例
                    </button>
                  </div>
                </div>

                {/* 搜索已有病例模式 */}
                {caseTab === 'search' ? (
                  <div className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="输入患者姓名、住院号/病案号、联系电话或诊断关键字搜索..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {filteredPatients.map((pt) => {
                        const isSelected = pt.id === selectedPatientId;
                        const lastRec = pt.records && pt.records.length > 0 ? pt.records[pt.records.length - 1] : null;
                        return (
                          <div
                            key={pt.id}
                            onClick={() => {
                              setSelectedPatientId(pt.id);
                              if (pt.spineRegion) {
                                setSpineRegion(pt.spineRegion);
                              }
                              setHideLivePreviewPoint(false);
                            }}
                            className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200'
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900">{pt.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                  {maskField(pt.gender, 1)} · {pt.age}岁
                                </span>
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                                    pt.spineRegion === 'cervical'
                                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  }`}
                                >
                                  {pt.spineRegion === 'cervical' ? '颈椎病例' : '腰椎病例'}
                                </span>
                                {pt.selfRegistered && (
                                  <span
                                    className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                    title="患者首次登录时自己建的档，请核实身份"
                                  >
                                    患者自助建档
                                  </span>
                                )}
                                <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                  病案号: {pt.hospitalId}
                                </span>
                                <span className="text-xs text-slate-400">
                                  电话: {maskField(pt.phone, 6)}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 font-medium">
                                临床诊断：{maskField(pt.diagnosis, 8)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                手术/治疗：{maskField(pt.surgery, 8)} （日期：{maskField(pt.surgeryDate, 6)}）
                              </div>
                              <div className="text-[11px] text-slate-500">
                                手术医生：{maskField(pt.surgeon, 8)}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end justify-between shrink-0 gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  {isSelected ? '当前已选中' : '点击选择'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAdminAuthModal({
                                      actionType: 'delete_patient',
                                      title: '确认删除病例',
                                      description: `您即将从云端数据库永久删除患者【${pt.name}（病案号：${pt.hospitalId || '-'}）】的病例及全部随访记录，删除后无法恢复。`,
                                      payload: { patientId: pt.id }
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition"
                                  title="删除该病例"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  删除病例
                                </button>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                已存随访：<strong className="text-indigo-600">{pt.records?.length || 0}</strong> 次
                                {lastRec
                                  ? isInfoUnlocked
                                    ? ` (最近: 腰VAS ${lastRec.backVas}/腿VAS ${lastRec.legVas})`
                                    : ' (详情已隐私隐藏 *)'
                                  : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {filteredPatients.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          未检索到匹配的病例，请尝试其他关键字或点击右上角“新建患者病例”
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 新建患者档案表单 */
                  <form onSubmit={handleCreatePatient} className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">患者姓名 *</label>
                        <input
                          type="text"
                          required
                          value={newPatientForm.name}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                          placeholder="例如：王建民"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">性别</label>
                        <select
                          value={newPatientForm.gender}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="女">女</option>
                          <option value="男">男</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">年龄 (岁) *</label>
                        <input
                          type="number"
                          required
                          min="5"
                          max="110"
                          value={newPatientForm.age}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                          placeholder="例如：48"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">住院号 / 病案号</label>
                        <input
                          type="text"
                          value={newPatientForm.hospitalId}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, hospitalId: e.target.value })}
                          placeholder="例如：ZY20260889 (留空自动生成)"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          患者手机号 <span className="font-normal text-slate-400">（患者登录用的手机号）</span>
                        </label>
                        <input
                          type="text"
                          value={newPatientForm.phone}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                          placeholder="例如：13800001234"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        患者邮箱 <span className="font-normal text-slate-400">（选填，仅存档）</span>
                      </label>
                      <input
                        type="email"
                        value={newPatientForm.email}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                        placeholder="例如：patient@example.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">临床诊断</label>
                        <input
                          type="text"
                          value={newPatientForm.diagnosis}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, diagnosis: e.target.value })}
                          placeholder="如：L4/5腰椎间盘突出症 / 特发性脊柱侧凸"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">手术方式 / 治疗方案</label>
                        <input
                          type="text"
                          value={newPatientForm.surgery}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, surgery: e.target.value })}
                          placeholder="如：UBE内镜髓核摘除 / 后路矫形内固定"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">手术医生</label>
                        <input
                          type="text"
                          value={newPatientForm.surgeon}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, surgeon: e.target.value })}
                          placeholder="如：张某某 主任医师"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCaseTab('search')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                      >
                        返回检索列表
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm flex items-center gap-1.5"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                        保存并选中该新病例
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>提示：点击任意已录入患者即可切换当前评估对象并查看其历史随访记录</span>
                <span className="text-indigo-600 font-medium">支持多时间点纵向追踪</span>
              </div>
            </div>

            {/* 右栏：当前选中病例详情与本次随访时间节点配置 (5列) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              {selectedPatient ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        当前选中随访档案
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                        {selectedPatient.name}
                        <span className="text-sm font-normal text-slate-500 ml-2">
                          ({maskField(selectedPatient.gender, 1)} · {selectedPatient.age}岁 · {selectedPatient.hospitalId})
                        </span>
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openPatientQr(selectedPatient)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        title="给患者扫码，在自己手机上填写问卷"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        患者扫码
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInfoUnlocked(!isInfoUnlocked);
                          flashToast(isInfoUnlocked ? '已隐藏患者敏感隐私信息' : '已显示患者全部信息', 2500);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                          isInfoUnlocked
                            ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {isInfoUnlocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            隐藏信息
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            显示所有信息
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openAdminAuthModal({
                            actionType: 'delete_patient',
                            title: '确认删除病例',
                            description: `您即将从云端数据库永久删除患者【${selectedPatient.name}（病案号：${selectedPatient.hospitalId || '-'}）】的病例及全部随访记录，删除后无法恢复。`,
                            payload: { patientId: selectedPatient.id }
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除病例
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-xs border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-500">临床诊断：</span>
                        <span className="font-semibold text-slate-800">
                          {maskField(selectedPatient.diagnosis, 8)}
                        </span>
                      </div>
                      {!isInfoUnlocked && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> 隐私保护中
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">手术方案：</span>
                      <span className="font-medium text-slate-700">
                        {maskField(selectedPatient.surgery, 8)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">手术医生：</span>
                      <span className="font-medium text-slate-700">
                        {maskField(selectedPatient.surgeon, 8)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">联系电话：</span>
                      <span className="font-medium text-slate-700">
                        {maskField(selectedPatient.phone || '未登记', 6)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">登录手机号：</span>
                      <span className="font-medium text-slate-700">
                        {selectedPatient.phone ? maskField(selectedPatient.phone, 6) : '未登记（患者无法自助登录）'}
                      </span>
                    </div>
                  </div>

                  {/* 本次随访阶段与日期设置 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        本次随访阶段节点
                      </label>
                      <select
                        value={followUpStage}
                        onChange={(e) => setFollowUpStage(e.target.value)}
                        className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="术前基线评估">术前基线评估</option>
                        <option value="术后1周随访">术后1周随访</option>
                        <option value="术后1个月随访">术后1个月随访</option>
                        <option value="术后3个月随访">术后3个月随访</option>
                        <option value="术后6个月随访">术后6个月随访</option>
                        <option value="术后1年随访">术后1年随访</option>
                        <option value="术后1年半随访">术后1年半随访</option>
                        <option value="术后2年随访">术后2年随访</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        随访评估日期
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 既往随访记录速览 */}
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>既往已归档随访记录 ({selectedPatient.records?.length || 0}次)</span>
                      <span className="text-[11px] text-slate-400 font-normal">可单独删除某次随访</span>
                    </div>
                    <div className="space-y-1.5 max-h-[155px] overflow-y-auto pr-1">
                      {(selectedPatient.records || []).map((rec) => (
                        <div
                          key={rec.recordId}
                          className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{rec.stage}</span>
                            <span className="text-slate-400 ml-2">{rec.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium">
                              腰VAS {isInfoUnlocked ? rec.backVas : '*'}
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">
                              腿VAS {isInfoUnlocked ? rec.legVas : '*'}
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                              ODI {isInfoUnlocked ? `${rec.odi}%` : '*'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                openAdminAuthModal({
                                  actionType: 'delete_record',
                                  title: '确认删除随访记录',
                                  description: `确定要从云端数据库永久删除患者【${selectedPatient.name}】在【${rec.stage} (${rec.date})】的随访记录吗？`,
                                  payload: { patientId: selectedPatient.id, recordId: rec.recordId }
                                })
                              }
                              className="p-1 rounded hover:bg-rose-100 text-rose-600 transition"
                              title="删除该次随访内容"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!selectedPatient.records || selectedPatient.records.length === 0) && (
                        <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl">
                          该患者暂无历史随访记录，本次填写将作为基线首次记录
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  当前暂无选中患者，请在左侧选择或新建患者病例
                </div>
              )}

              <button
                onClick={() => setCurrentStep(1)}
                disabled={!selectedPatient}
                className="mt-5 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
              >
                <span>确认患者信息，下一步选择疾病部位分支（颈椎 / 腰椎）</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            第 1 步：患者疾病分支选择（“我是颈椎疾病患者” vs “我是腰椎疾病患者”）
           ================================================================ */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  问卷分支选择
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                  请选择您本次随访评估的疾病部位类型
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  不同部位的脊柱疾病对应不同的专项医学量表，请根据您的实际情况点击选择下方对应卡片进入填写
                </p>
              </div>
              <div className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700">
                当前已选分支：
                <span className="text-indigo-600 ml-1">
                  {spineRegion === 'cervical' ? '我是颈椎疾病患者' : '我是腰椎疾病患者'}
                </span>
              </div>
            </div>

            {/* 横向双大卡片：我是腰椎疾病患者 vs 我是颈椎疾病患者 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* 分支 A：我是腰椎疾病患者 */}
              <div
                onClick={() => {
                  setSpineRegion('lumbar');
                  setHideLivePreviewPoint(false);
                }}
                className={`rounded-2xl border-2 p-6 transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                  spineRegion === 'lumbar'
                    ? 'bg-indigo-50/60 border-indigo-600 ring-4 ring-indigo-100'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${
                          spineRegion === 'lumbar'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        腰
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                          腰椎 / 胸腰椎随访通道
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                          我是腰椎疾病患者
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        spineRegion === 'lumbar'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {spineRegion === 'lumbar' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已选中
                        </>
                      ) : (
                        '点击选择'
                      )}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    适用于：腰椎间盘突出症、腰椎管狭窄症、腰椎滑脱症、腰肌劳损及青少年/成人脊柱侧弯畸形等腰背部及下肢症状患者。
                  </p>

                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800">
                      本分支需依次填写以下 4 份问卷：
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>腰部疼痛 & 下肢痛 VAS 评分</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>完整详细的 ODI 评分调查问卷 (10项)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                        <span>完整详细的 SF-36 健康调查问卷 (36题)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">4</span>
                        <span>完整详细的 SRS-22 问卷 (非侧弯可跳过)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpineRegion('lumbar');
                    setHideLivePreviewPoint(false);
                    setCurrentStep(2);
                  }}
                  className="mt-5 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <span>选择“我是腰椎疾病患者”，开始填写问卷</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 分支 B：我是颈椎疾病患者 */}
              <div
                onClick={() => {
                  setSpineRegion('cervical');
                  setHideLivePreviewPoint(false);
                }}
                className={`rounded-2xl border-2 p-6 transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                  spineRegion === 'cervical'
                    ? 'bg-cyan-50/60 border-cyan-600 ring-4 ring-cyan-100'
                    : 'bg-white border-slate-200 hover:border-cyan-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${
                          spineRegion === 'cervical'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        颈
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-100/80 px-2.5 py-0.5 rounded-full">
                          颈椎疾病专项随访通道
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                          我是颈椎疾病患者
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        spineRegion === 'cervical'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {spineRegion === 'cervical' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已选中
                        </>
                      ) : (
                        '点击选择'
                      )}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    适用于：神经根型颈椎病、脊髓型颈椎病、混合型颈椎病、颈椎间盘突出症、颈椎管狭窄及后纵韧带骨化症(OPLL)等颈肩痛、上肢麻痛或四肢精细动作障碍患者。
                  </p>

                  <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                    <div className="text-xs font-bold text-slate-800">
                      本分支需依次填写以下 4 份问卷：
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>颈痛 & 上肢痛 VAS 评分 (可视化表情)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>完整详细的颈椎 JOA 评分问卷 (17分法)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                        <span>完整详细的 NDI 颈椎功能障碍问卷 (10项)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">4</span>
                        <span>完整详细的 SF-36 健康调查问卷 (36题)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpineRegion('cervical');
                    setHideLivePreviewPoint(false);
                    setCurrentStep(2);
                  }}
                  className="mt-5 w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <span>选择“我是颈椎疾病患者”，开始填写问卷</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(0)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                返回上一步（病例建档/检索）
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <span>
                  进入{spineRegion === 'cervical' ? '颈痛/上肢痛 VAS 评分' : '腰/腿痛 VAS 评分'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            第 2 步 (腰椎分支)：腰部疼痛 VAS 评分 & 下肢疼痛 VAS 评分（横向双卡片+可视化表情）
           ================================================================ */}
        {currentStep === 2 && spineRegion === 'lumbar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  第一部分（腰椎分支）：腰部疼痛 VAS 评分 & 下肢疼痛 VAS 评分（带可视化表情提示）
                </h2>
                <p className="text-xs text-slate-500">
                  请患者根据近期或当前最真实的感受，在 0～10 分标尺上滑动或点击对应表情数字（0分为完全无痛，10分为难以忍受的最剧烈疼痛）
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                  当前腰部 VAS：{backVas} 分 ({currentBackVasInfo.label})
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                  当前下肢 VAS：{legVas} 分 ({currentLegVasInfo.label})
                </span>
              </div>
            </div>

            {/* 横向并排：左侧腰部疼痛 VAS，右侧下肢放射痛 VAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 卡片1：腰部疼痛 VAS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        部位 A：腰背部区域
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        腰部疼痛 VAS 评分（腰痛、腰酸、腰部僵硬痛）
                      </h3>
                    </div>
                    <div
                      className="px-3.5 py-1.5 rounded-xl font-bold text-lg flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: currentBackVasInfo.bg,
                        color: currentBackVasInfo.color,
                        borderColor: currentBackVasInfo.color
                      }}
                    >
                      <span>{currentBackVasInfo.face}</span>
                      <span>{backVas} 分</span>
                    </div>
                  </div>

                  {/* 动态可视化大表情反馈区 */}
                  <div
                    className="my-4 p-4 rounded-2xl border transition-all flex items-center gap-4"
                    style={{
                      backgroundColor: currentBackVasInfo.bg,
                      borderColor: `${currentBackVasInfo.color}40`
                    }}
                  >
                    <div className="text-5xl select-none shrink-0">{currentBackVasInfo.face}</div>
                    <div>
                      <div className="text-base font-bold" style={{ color: currentBackVasInfo.color }}>
                        {backVas} 分 — {currentBackVasInfo.label}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{currentBackVasInfo.desc}</div>
                    </div>
                  </div>

                  {/* 连续可视化渐变滑块 */}
                  <div className="space-y-2 my-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={backVas}
                      onChange={(e) => setBackVas(Number(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background:
                          'linear-gradient(to right, #10b981 0%, #84cc16 25%, #f59e0b 50%, #ef4444 75%, #7f1d1d 100%)'
                      }}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                      <span>0 无痛</span>
                      <span>2 轻度痛</span>
                      <span>5 中度痛</span>
                      <span>8 剧烈痛</span>
                      <span>10 极度剧痛</span>
                    </div>
                  </div>

                  {/* 0~10 表情数字矩阵点选 */}
                  <div className="grid grid-cols-11 gap-1.5 pt-2">
                    {VAS_LEVELS.map((item) => {
                      const active = backVas === item.score;
                      return (
                        <button
                          key={item.score}
                          type="button"
                          onClick={() => setBackVas(item.score)}
                          className={`py-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                            active
                              ? 'ring-2 ring-indigo-600 font-bold shadow-sm scale-105'
                              : 'hover:bg-slate-50 border-slate-200'
                          }`}
                          style={{
                            backgroundColor: active ? item.bg : '#ffffff',
                            borderColor: active ? item.color : undefined
                          }}
                        >
                          <span className="text-base leading-none">{item.face}</span>
                          <span
                            className="text-xs mt-1 font-bold"
                            style={{ color: active ? item.color : '#334155' }}
                          >
                            {item.score}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 卡片2：下肢疼痛 VAS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        部位 B：下肢神经放射区域
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        下肢疼痛 VAS 评分（臀部、大腿、小腿或足部放射痛/麻痛）
                      </h3>
                    </div>
                    <div
                      className="px-3.5 py-1.5 rounded-xl font-bold text-lg flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: currentLegVasInfo.bg,
                        color: currentLegVasInfo.color,
                        borderColor: currentLegVasInfo.color
                      }}
                    >
                      <span>{currentLegVasInfo.face}</span>
                      <span>{legVas} 分</span>
                    </div>
                  </div>

                  {/* 动态可视化大表情反馈区 */}
                  <div
                    className="my-4 p-4 rounded-2xl border transition-all flex items-center gap-4"
                    style={{
                      backgroundColor: currentLegVasInfo.bg,
                      borderColor: `${currentLegVasInfo.color}40`
                    }}
                  >
                    <div className="text-5xl select-none shrink-0">{currentLegVasInfo.face}</div>
                    <div>
                      <div className="text-base font-bold" style={{ color: currentLegVasInfo.color }}>
                        {legVas} 分 — {currentLegVasInfo.label}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {legVas === 0
                          ? '无任何下肢放射痛或麻木抽痛症状（神经根受累证据不足）'
                          : currentLegVasInfo.desc}
                      </div>
                    </div>
                  </div>

                  {/* 连续可视化渐变滑块 */}
                  <div className="space-y-2 my-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={legVas}
                      onChange={(e) => setLegVas(Number(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background:
                          'linear-gradient(to right, #10b981 0%, #84cc16 25%, #f59e0b 50%, #ef4444 75%, #7f1d1d 100%)'
                      }}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                      <span>0 无腿痛</span>
                      <span>2 轻度痛</span>
                      <span>5 中度放射痛</span>
                      <span>8 剧烈痛</span>
                      <span>10 极度剧痛</span>
                    </div>
                  </div>

                  {/* 0~10 表情数字矩阵点选 */}
                  <div className="grid grid-cols-11 gap-1.5 pt-2">
                    {VAS_LEVELS.map((item) => {
                      const active = legVas === item.score;
                      return (
                        <button
                          key={item.score}
                          type="button"
                          onClick={() => setLegVas(item.score)}
                          className={`py-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                            active
                              ? 'ring-2 ring-emerald-600 font-bold shadow-sm scale-105'
                              : 'hover:bg-slate-50 border-slate-200'
                          }`}
                          style={{
                            backgroundColor: active ? item.bg : '#ffffff',
                            borderColor: active ? item.color : undefined
                          }}
                        >
                          <span className="text-base leading-none">{item.face}</span>
                          <span
                            className="text-xs mt-1 font-bold"
                            style={{ color: active ? item.color : '#334155' }}
                          >
                            {item.score}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部横向切换栏 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 ${isDoctor ? '' : 'invisible'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                返回上一步（疾病部位分支选择）
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <span>VAS 评分填写完成，进入下一部分（ODI 功能障碍问卷）</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            第 2 步 (颈椎分支)：颈部疼痛 VAS 评分 & 上肢疼痛 VAS 评分（横向双卡片+可视化表情）
           ================================================================ */}
        {currentStep === 2 && spineRegion === 'cervical' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-600" />
                  第一部分（颈椎分支）：颈痛 VAS 评分 & 上肢痛 VAS 评分（带可视化表情提示）
                </h2>
                <p className="text-xs text-slate-500">
                  请患者根据近期或当前最真实的感受，在 0～10 分标尺上评估颈肩部疼痛及上肢（手臂/手指）放射痛程度
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                  当前颈痛 VAS：{neckVas} 分 ({currentNeckVasInfo.label})
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                  当前上肢痛 VAS：{armVas} 分 ({currentArmVasInfo.label})
                </span>
              </div>
            </div>

            {/* 横向并排：左侧颈部疼痛 VAS，右侧上肢放射痛 VAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 卡片1：颈部疼痛 VAS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        部位 A：颈项及肩背部区域
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        颈部疼痛 VAS 评分（颈痛、后颈僵硬酸痛、肩颈酸胀痛）
                      </h3>
                    </div>
                    <div
                      className="px-3.5 py-1.5 rounded-xl font-bold text-lg flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: currentNeckVasInfo.bg,
                        color: currentNeckVasInfo.color,
                        borderColor: currentNeckVasInfo.color
                      }}
                    >
                      <span>{currentNeckVasInfo.face}</span>
                      <span>{neckVas} 分</span>
                    </div>
                  </div>

                  {/* 动态可视化大表情反馈区 */}
                  <div
                    className="my-4 p-4 rounded-2xl border transition-all flex items-center gap-4"
                    style={{
                      backgroundColor: currentNeckVasInfo.bg,
                      borderColor: `${currentNeckVasInfo.color}40`
                    }}
                  >
                    <div className="text-5xl select-none shrink-0">{currentNeckVasInfo.face}</div>
                    <div>
                      <div className="text-base font-bold" style={{ color: currentNeckVasInfo.color }}>
                        {neckVas} 分 — {currentNeckVasInfo.label}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{currentNeckVasInfo.desc}</div>
                    </div>
                  </div>

                  {/* 连续可视化渐变滑块 */}
                  <div className="space-y-2 my-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={neckVas}
                      onChange={(e) => setNeckVas(Number(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background:
                          'linear-gradient(to right, #10b981 0%, #84cc16 25%, #f59e0b 50%, #ef4444 75%, #7f1d1d 100%)'
                      }}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                      <span>0 无颈痛</span>
                      <span>2 轻度痛</span>
                      <span>5 中度痛</span>
                      <span>8 剧烈痛</span>
                      <span>10 极度剧痛</span>
                    </div>
                  </div>

                  {/* 0~10 表情数字矩阵点选 */}
                  <div className="grid grid-cols-11 gap-1.5 pt-2">
                    {VAS_LEVELS.map((item) => {
                      const active = neckVas === item.score;
                      return (
                        <button
                          key={item.score}
                          type="button"
                          onClick={() => setNeckVas(item.score)}
                          className={`py-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                            active
                              ? 'ring-2 ring-indigo-600 font-bold shadow-sm scale-105'
                              : 'hover:bg-slate-50 border-slate-200'
                          }`}
                          style={{
                            backgroundColor: active ? item.bg : '#ffffff',
                            borderColor: active ? item.color : undefined
                          }}
                        >
                          <span className="text-base leading-none">{item.face}</span>
                          <span
                            className="text-xs mt-1 font-bold"
                            style={{ color: active ? item.color : '#334155' }}
                          >
                            {item.score}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 卡片2：上肢疼痛 VAS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        部位 B：上肢神经根放射区域
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        上肢疼痛 VAS 评分（肩部、上臂、前臂或手指放射痛/麻痛）
                      </h3>
                    </div>
                    <div
                      className="px-3.5 py-1.5 rounded-xl font-bold text-lg flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: currentArmVasInfo.bg,
                        color: currentArmVasInfo.color,
                        borderColor: currentArmVasInfo.color
                      }}
                    >
                      <span>{currentArmVasInfo.face}</span>
                      <span>{armVas} 分</span>
                    </div>
                  </div>

                  {/* 动态可视化大表情反馈区 */}
                  <div
                    className="my-4 p-4 rounded-2xl border transition-all flex items-center gap-4"
                    style={{
                      backgroundColor: currentArmVasInfo.bg,
                      borderColor: `${currentArmVasInfo.color}40`
                    }}
                  >
                    <div className="text-5xl select-none shrink-0">{currentArmVasInfo.face}</div>
                    <div>
                      <div className="text-base font-bold" style={{ color: currentArmVasInfo.color }}>
                        {armVas} 分 — {currentArmVasInfo.label}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {armVas === 0
                          ? '无任何上肢放射痛或手臂麻木抽痛症状'
                          : currentArmVasInfo.desc}
                      </div>
                    </div>
                  </div>

                  {/* 连续可视化渐变滑块 */}
                  <div className="space-y-2 my-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={armVas}
                      onChange={(e) => setArmVas(Number(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background:
                          'linear-gradient(to right, #10b981 0%, #84cc16 25%, #f59e0b 50%, #ef4444 75%, #7f1d1d 100%)'
                      }}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
                      <span>0 无上肢痛</span>
                      <span>2 轻度痛</span>
                      <span>5 中度放射痛</span>
                      <span>8 剧烈痛</span>
                      <span>10 极度剧痛</span>
                    </div>
                  </div>

                  {/* 0~10 表情数字矩阵点选 */}
                  <div className="grid grid-cols-11 gap-1.5 pt-2">
                    {VAS_LEVELS.map((item) => {
                      const active = armVas === item.score;
                      return (
                        <button
                          key={item.score}
                          type="button"
                          onClick={() => setArmVas(item.score)}
                          className={`py-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                            active
                              ? 'ring-2 ring-emerald-600 font-bold shadow-sm scale-105'
                              : 'hover:bg-slate-50 border-slate-200'
                          }`}
                          style={{
                            backgroundColor: active ? item.bg : '#ffffff',
                            borderColor: active ? item.color : undefined
                          }}
                        >
                          <span className="text-base leading-none">{item.face}</span>
                          <span
                            className="text-xs mt-1 font-bold"
                            style={{ color: active ? item.color : '#334155' }}
                          >
                            {item.score}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部横向切换栏 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 ${isDoctor ? '' : 'invisible'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                返回上一步（疾病部位分支选择）
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <span>颈痛/上肢痛 VAS 填写完成，进入下一部分（颈椎 JOA 评分问卷）</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            第 3 步 (腰椎分支)：完整详细的 ODI 评分调查问卷（10个维度，横向5题/页分栏）
           ================================================================ */}
        {currentStep === 3 && spineRegion === 'lumbar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  第二部分（腰椎分支）：Oswestry 功能障碍指数问卷（完整详细 10 项 ODI 评分）
                </h2>
                <p className="text-xs text-slate-500">
                  请根据腰背部或腿部问题对您日常生活的实际影响，在每一部分选择最符合您今天状态的一项（每项 0～5 分）
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
                  <button
                    onClick={() => setOdiPage(0)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      odiPage === 0 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    前半部分 (第 1~5 项)
                  </button>
                  <button
                    onClick={() => setOdiPage(1)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      odiPage === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    后半部分 (第 6~10 项)
                  </button>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  已完成 {odiCompletedCount}/10 项 · 实时 ODI：{odiScore}%
                </span>
              </div>
            </div>

            {/* 横向5列卡片布局展示当前页的5个ODI维度 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
              {ODI_QUESTIONS.slice(odiPage * 5, odiPage * 5 + 5).map((q) => {
                const selectedVal = odiAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-900 leading-snug">{q.section}</h3>
                        {q.optional && (
                          <button
                            type="button"
                            onClick={() => setOdiAnswers({ ...odiAnswers, [q.id]: 'skip' })}
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                              selectedVal === 'skip'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {selectedVal === 'skip' ? '已选不适用' : '不适用可跳过'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {q.options.map((opt) => {
                          const isChecked = selectedVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setOdiAnswers({ ...odiAnswers, [q.id]: opt.value })}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-2 ${
                                isChecked
                                  ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 font-semibold ring-1 ring-indigo-300'
                                  : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isChecked ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-500'
                                }`}
                              >
                                {opt.value}
                              </span>
                              <span className="leading-relaxed">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 底部横向切换栏 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => {
                  if (odiPage === 1) setOdiPage(0);
                  else setCurrentStep(2);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                {odiPage === 1 ? '返回 ODI 前半部分 (第 1~5 项)' : '返回上一步（VAS 疼痛评分）'}
              </button>

              {odiPage === 0 ? (
                <button
                  onClick={() => setOdiPage(1)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>继续填写 ODI 后半部分（第 6~10 项）</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>ODI 问卷填写完成，进入下一部分（SF-36 健康调查问卷）</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            第 3 步 (颈椎分支)：完整详细的颈椎 JOA 评分调查问卷（17分法，6大核心项横向网格）
           ================================================================ */}
        {currentStep === 3 && spineRegion === 'cervical' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-cyan-600" />
                  第二部分（颈椎分支）：日本骨科学会颈椎 JOA 评分问卷（完整 17 分法）
                </h2>
                <p className="text-xs text-slate-500">
                  全面评估上肢运动功能(4分)、下肢运动功能(4分)、上肢/下肢/躯干感觉功能(6分)及膀胱排尿功能(3分)，满分 17 分（分值越低代表脊髓功能受损越重）
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-200">
                  已完成 {joaCompletedCount}/6 项 · 实时颈椎 JOA 总分：{joaResult.total} / 17 分
                </span>
              </div>
            </div>

            {/* 横向3列网格展示6项颈椎 JOA 评估内容 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {CERVICAL_JOA_QUESTIONS.map((q) => {
                const selectedVal = joaAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-900 leading-snug">{q.section}</h3>
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          {q.category} (满分{q.maxScore}分)
                        </span>
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isChecked = selectedVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setJoaAnswers({ ...joaAnswers, [q.id]: opt.value })}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-2 ${
                                isChecked
                                  ? 'bg-cyan-50/90 border-cyan-600 text-cyan-950 font-semibold ring-1 ring-cyan-300'
                                  : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isChecked
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-white border border-slate-300 text-slate-500'
                                }`}
                              >
                                {opt.value}
                              </span>
                              <span className="leading-relaxed">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 底部横向切换栏 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                返回上一步（颈痛/上肢痛 VAS 评分）
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <span>颈椎 JOA 评分填写完成，进入下一部分（NDI 颈椎功能障碍问卷）</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            第 4 步 (颈椎分支)：完整详细的 NDI 颈椎功能障碍指数问卷（10个维度，横向5题/页分栏）
           ================================================================ */}
        {currentStep === 4 && spineRegion === 'cervical' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-600" />
                  第三部分（颈椎分支）：NDI 颈椎功能障碍指数问卷（完整详细 10 项评分）
                </h2>
                <p className="text-xs text-slate-500">
                  涵盖颈痛程度、个人自理、提举重物、阅读看手机、头痛、集中注意力、工作、驾驶、睡眠与休闲娱乐（每项 0～5 分）
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
                  <button
                    onClick={() => setNdiPage(0)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      ndiPage === 0 ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    前半部分 (第 1~5 项)
                  </button>
                  <button
                    onClick={() => setNdiPage(1)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      ndiPage === 1 ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    后半部分 (第 6~10 项)
                  </button>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-200">
                  已完成 {ndiCompletedCount}/10 项 · 实时 NDI：{ndiScore}%
                </span>
              </div>
            </div>

            {/* 横向5列卡片布局展示当前页的5个 NDI 维度 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
              {NDI_QUESTIONS.slice(ndiPage * 5, ndiPage * 5 + 5).map((q) => {
                const selectedVal = ndiAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-900 leading-snug">{q.section}</h3>
                        {q.optional && (
                          <button
                            type="button"
                            onClick={() => setNdiAnswers({ ...ndiAnswers, [q.id]: 'skip' })}
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                              selectedVal === 'skip'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {selectedVal === 'skip' ? '已选不适用' : '不适用可跳过'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {q.options.map((opt) => {
                          const isChecked = selectedVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setNdiAnswers({ ...ndiAnswers, [q.id]: opt.value })}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-2 ${
                                isChecked
                                  ? 'bg-cyan-50/90 border-cyan-600 text-cyan-950 font-semibold ring-1 ring-cyan-300'
                                  : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isChecked
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-white border border-slate-300 text-slate-500'
                                }`}
                              >
                                {opt.value}
                              </span>
                              <span className="leading-relaxed">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 底部横向切换栏 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => {
                  if (ndiPage === 1) setNdiPage(0);
                  else setCurrentStep(3);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                {ndiPage === 1 ? '返回 NDI 前半部分 (第 1~5 项)' : '返回上一步（颈椎 JOA 评分）'}
              </button>

              {ndiPage === 0 ? (
                <button
                  onClick={() => setNdiPage(1)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>继续填写 NDI 后半部分（第 6~10 项）</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>NDI 问卷填写完成，进入下一部分（SF-36 健康调查问卷）</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            SF-36 评分调查问卷（腰椎分支第 4 步 / 颈椎分支第 5 步，完整 36 题）
           ================================================================ */}
        {isSf36Step && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-indigo-600" />
                  {spineRegion === 'cervical'
                    ? '第四部分（颈椎分支）：SF-36 健康调查简表（完整详细 36 题 · 自动计算 PCS 与 MCS）'
                    : '第三部分（腰椎分支）：SF-36 健康调查简表（完整详细 36 题 · 自动计算 PCS 与 MCS）'}
                </h2>
                <p className="text-xs text-slate-500">
                  涵盖生理机能(PF)、生理职能(RP)、躯体疼痛(BP)、一般健康(GH)、精力(VT)、社会功能(SF)、情感职能(RE)与精神健康(MH)八大维度
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  已答 {sf36CompletedCount}/36 题
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  实时 PCS：{sf36Result.PCS} | MCS：{sf36Result.MCS}
                </span>
              </div>
            </div>

            {/* SF-36 横向6个子模块标签栏 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {SF36_GROUPS.map((grp, idx) => {
                const active = sf36GroupIdx === idx;
                const doneCount = grp.questions.filter((q) => sf36Answers[q.id] !== undefined).length;
                return (
                  <button
                    key={grp.groupId}
                    onClick={() => setSf36GroupIdx(idx)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{grp.title.split('（')[0]}</div>
                    <div className={`text-[10px] mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                      已填 {doneCount}/{grp.questions.length} 题
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 当前 SF-36 子模块的横向双列题目网格 */}
            {(() => {
              const activeGroup = SF36_GROUPS[sf36GroupIdx];
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{activeGroup.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{activeGroup.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">
                      模块进度：{sf36GroupIdx + 1} / {SF36_GROUPS.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {activeGroup.questions.map((q) => {
                      const val = sf36Answers[q.id];
                      return (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0">
                              题 {q.num}
                            </span>
                            <span className="text-xs font-bold text-slate-800 leading-relaxed">
                              {q.text}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {q.options.map((opt) => {
                              const checked = val === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setSf36Answers({ ...sf36Answers, [q.id]: opt.value })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex-1 min-w-[88px] text-center ${
                                    checked
                                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 底部横向切换栏 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => {
                  if (sf36GroupIdx > 0) setSf36GroupIdx(sf36GroupIdx - 1);
                  else setCurrentStep(spineRegion === 'cervical' ? 4 : 3);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                {sf36GroupIdx > 0
                  ? '上一组 SF-36 题目'
                  : spineRegion === 'cervical'
                  ? '返回上一步（NDI 问卷）'
                  : '返回上一步（ODI 问卷）'}
              </button>

              {sf36GroupIdx < SF36_GROUPS.length - 1 ? (
                <button
                  onClick={() => setSf36GroupIdx(sf36GroupIdx + 1)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>下一组 SF-36 题目 ({sf36GroupIdx + 2}/{SF36_GROUPS.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : spineRegion === 'cervical' ? (
                <button
                  onClick={() => setCurrentStep(6)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>颈椎全部问卷填写完毕，生成随访曲线与临床结果解读</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>SF-36 填写完成，进入下一部分（SRS-22 脊柱问卷）</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            第 5 步 (腰椎分支)：完整详细的 SRS-22 评分调查问卷（完整 22 题，保留非脊柱侧弯跳过选项）
           ================================================================ */}
        {currentStep === 5 && spineRegion === 'lumbar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  第四部分（腰椎分支）：SRS-22 脊柱学会患者问卷（完整详细 22 题）
                </h2>
                <p className="text-xs text-slate-500">
                  评估功能/活动度、疼痛、自我形象/躯干外观满意度、心理健康及治疗满意度五个核心维度（每题 1~5 分）
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
                  {[0, 1, 2].map((p) => (
                    <button
                      key={p}
                      onClick={() => setSrs22Page(p)}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        srs22Page === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      第 {p === 0 ? '1~8' : p === 1 ? '9~16' : '17~22'} 题
                    </button>
                  ))}
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  {srs22Skipped
                    ? '当前状态：已选择跳过 SRS-22'
                    : `已答 ${srs22CompletedCount}/22 题 · 外观满意度：${srs22Result.image} 分`}
                </span>
              </div>
            </div>

            {/* 非脊柱侧弯患者可跳过提示横幅与快捷跳过按钮 */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-amber-900">
                    温馨提示：不是脊柱侧弯患者可以选择跳过
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    SRS-22 量表主要用于脊柱侧弯/脊柱畸形患者的自我形象与专项随访评估；若您是单纯腰椎间盘突出、腰椎管狭窄或腰椎滑脱等非脊柱侧弯患者，可直接点击右侧按钮跳过本部分。
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {srs22Skipped && (
                  <button
                    type="button"
                    onClick={() => {
                      setSrs22Skipped(false);
                      setSavedToast('已恢复 SRS-22 问卷作答模式');
                      setTimeout(() => setSavedToast(''), 2500);
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition"
                  >
                    恢复填写 SRS-22
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSrs22Skipped(true);
                    setCurrentStep(6);
                    setSavedToast('已选择“我不是脊柱侧弯患者，跳过该部分”，直接生成结果解读');
                    setTimeout(() => setSavedToast(''), 3000);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition"
                >
                  <span>我不是脊柱侧弯患者，跳过该部分</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 横向网格展示当前页的 SRS-22 题目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {SRS22_QUESTIONS.slice(
                srs22Page === 0 ? 0 : srs22Page === 1 ? 8 : 16,
                srs22Page === 0 ? 8 : srs22Page === 1 ? 16 : 22
              ).map((q) => {
                const selectedScore = srs22Answers[q.id];
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-bold shrink-0">
                          题 {q.num}
                        </span>
                        <span className="text-xs font-bold text-slate-900 leading-relaxed">{q.text}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                        {q.domainName}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                      {q.options.map((opt) => {
                        const active = selectedScore === opt.score;
                        return (
                          <button
                            key={opt.score}
                            type="button"
                            onClick={() => {
                              setSrs22Skipped(false);
                              setSrs22Answers({ ...srs22Answers, [q.id]: opt.score });
                            }}
                            className={`p-2 rounded-xl border text-xs transition flex flex-col items-center justify-center text-center ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                                : 'bg-slate-50/70 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                            }`}
                          >
                            <span className="leading-snug">{opt.label}</span>
                            <span
                              className={`text-[10px] mt-0.5 ${
                                active ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              ({opt.score}分)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 底部横向切换栏 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => {
                  if (srs22Page > 0) setSrs22Page(srs22Page - 1);
                  else setCurrentStep(4);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                {srs22Page > 0 ? '上一页 SRS-22 题目' : '返回上一步（SF-36 问卷）'}
              </button>

              {srs22Page < 2 ? (
                <button
                  onClick={() => setSrs22Page(srs22Page + 1)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>下一页 SRS-22 题目 ({srs22Page + 2}/3)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSrs22Skipped(false);
                    setCurrentStep(6);
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>全部问卷填写完毕，生成随访曲线与临床结果解读</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            第 6 步：结果解读与随访历史变化曲线图（自适应腰椎分支与颈椎分支）
           ================================================================ */}
        {currentStep === 6 && (
          <div className="space-y-4">
            {/* 顶部核心指标一览卡片带 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">
                  {spineRegion === 'cervical' ? '颈部疼痛 VAS' : '腰部疼痛 VAS'}
                </div>
                <div className="text-2xl font-extrabold text-indigo-600 mt-1 flex items-center gap-1.5">
                  <span>{spineRegion === 'cervical' ? neckVas : backVas} 分</span>
                  <span className="text-xl">
                    {spineRegion === 'cervical' ? currentNeckVasInfo.face : currentBackVasInfo.face}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {spineRegion === 'cervical' ? currentNeckVasInfo.label : currentBackVasInfo.label}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">
                  {spineRegion === 'cervical' ? '上肢疼痛 VAS (臂痛)' : '下肢疼痛 VAS (腿痛)'}
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <span>{spineRegion === 'cervical' ? armVas : legVas} 分</span>
                  <span className="text-xl">
                    {spineRegion === 'cervical' ? currentArmVasInfo.face : currentLegVasInfo.face}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {spineRegion === 'cervical' ? currentArmVasInfo.label : currentLegVasInfo.label}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">
                  {spineRegion === 'cervical' ? 'NDI 颈椎功能障碍指数' : 'ODI 功能障碍指数'}
                </div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">
                  {spineRegion === 'cervical' ? ndiScore : odiScore}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {(spineRegion === 'cervical' ? ndiScore : odiScore) <= 20
                    ? '轻度功能障碍'
                    : (spineRegion === 'cervical' ? ndiScore : odiScore) <= 40
                    ? '中度功能障碍'
                    : '重度功能障碍'}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">SF-36 躯体健康 (PCS)</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{sf36Result.PCS}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  PF:{sf36Result.PF} / BP:{sf36Result.BP}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">SF-36 精神健康 (MCS)</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{sf36Result.MCS}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  MH:{sf36Result.MH} / VT:{sf36Result.VT}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">
                  {spineRegion === 'cervical' ? '颈椎 JOA 脊髓评分' : 'SRS-22 外观满意度'}
                </div>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">
                  {spineRegion === 'cervical'
                    ? `${joaResult.total} / 17分`
                    : srs22Skipped
                    ? '已跳过'
                    : `${srs22Result.image} 分`}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {spineRegion === 'cervical'
                    ? `上肢:${joaResult.motorUpper} 下肢:${joaResult.motorLower} 感觉:${joaResult.sensoryTotal}`
                    : srs22Skipped
                    ? '非脊柱侧弯患者'
                    : `SRS-22 总均分：${srs22Result.total} 分`}
                </div>
              </div>
            </div>

            {/* 横向双栏主体：左侧为临床结构化结果解读与各量表细分，右侧为疼痛VAS历史变化曲线图 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* 左栏 (6列)：三层面结构化结果解读 + 细分维度详情 */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        智能临床评估结论（{spineRegion === 'cervical' ? '颈椎疾病通道' : '腰椎疾病通道'}）
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        问卷结果自动分层解读报告
                      </h3>
                    </div>
                    {isDoctor && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingInterpretation(!isEditingInterpretation)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        {isEditingInterpretation ? '完成手动微调' : '医师手动微调'}
                      </button>
                      <button
                        onClick={handleCopyReport}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedReport ? '已复制完整报告' : '一键复制报告'}
                      </button>
                    </div>
                    )}
                  </div>

                  {/* 三层面高亮卡片展示 */}
                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                      <Activity className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                        {clinicalInterpretation.physicalLine}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-3">
                      <Brain className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                        {clinicalInterpretation.mentalLine}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                        {clinicalInterpretation.neuroLine}
                      </div>
                    </div>
                  </div>

                  {/* 原生纯文本预览与医师可编辑框 */}
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>{isDoctor ? '标准病历粘贴格式文本：' : '评估结论：'}</span>
                      {isDoctor && <span className="text-[11px] text-slate-400 font-normal">可直接复制粘贴至住院/门诊电子病历</span>}
                    </div>
                    <textarea
                      rows={4}
                      value={customInterpretation}
                      readOnly={!isEditingInterpretation}
                      onChange={(e) => setCustomInterpretation(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs sm:text-sm leading-relaxed font-medium focus:outline-none ${
                        isEditingInterpretation
                          ? 'bg-white border-indigo-400 ring-2 ring-indigo-100 text-slate-900'
                          : 'bg-slate-900 text-slate-100 border-slate-800'
                      }`}
                    />
                  </div>

                  {/* SF-36 与 SRS-22 细分维度条 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        SF-36 八维度百分制得分
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">生理PF</div>
                          <div className="font-bold text-slate-800">{sf36Result.PF}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">职能RP</div>
                          <div className="font-bold text-slate-800">{sf36Result.RP}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">疼痛BP</div>
                          <div className="font-bold text-slate-800">{sf36Result.BP}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">总体GH</div>
                          <div className="font-bold text-slate-800">{sf36Result.GH}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">精力VT</div>
                          <div className="font-bold text-slate-800">{sf36Result.VT}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">社交SF</div>
                          <div className="font-bold text-slate-800">{sf36Result.SF}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">情感RE</div>
                          <div className="font-bold text-slate-800">{sf36Result.RE}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <div className="text-slate-400">精神MH</div>
                          <div className="font-bold text-slate-800">{sf36Result.MH}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        {spineRegion === 'cervical'
                          ? '颈椎 JOA 四维得分 (满分17分)'
                          : 'SRS-22 五维度均分 (满分5.0)'}
                      </div>
                      {spineRegion === 'cervical' ? (
                        <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                          <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                            <div className="text-slate-400">上肢运动</div>
                            <div className="font-bold text-slate-800">{joaResult.motorUpper}/4</div>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                            <div className="text-slate-400">下肢运动</div>
                            <div className="font-bold text-slate-800">{joaResult.motorLower}/4</div>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                            <div className="text-slate-400">感觉功能</div>
                            <div className="font-bold text-slate-800">{joaResult.sensoryTotal}/6</div>
                          </div>
                          <div className="bg-cyan-50 p-1.5 rounded border border-cyan-200 text-center">
                            <div className="text-cyan-700 font-semibold">膀胱功能</div>
                            <div className="font-bold text-cyan-800">{joaResult.bladder}/3</div>
                          </div>
                        </div>
                      ) : srs22Skipped ? (
                        <div className="py-3 px-2 bg-white rounded border border-slate-200 text-center text-xs text-slate-500">
                          患者已选择“不是脊柱侧弯患者，跳过该部分”
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-1 text-[11px]">
                          <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                            <div className="text-slate-400">功能</div>
                            <div className="font-bold text-slate-800">{srs22Result.function}</div>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                            <div className="text-slate-400">疼痛</div>
                            <div className="font-bold text-slate-800">{srs22Result.pain}</div>
                          </div>
                          <div className="bg-rose-50 p-1.5 rounded border border-rose-200 text-center">
                            <div className="text-rose-600 font-semibold">外观</div>
                            <div className="font-bold text-rose-700">{srs22Result.image}</div>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                            <div className="text-slate-400">心理</div>
                            <div className="font-bold text-slate-800">{srs22Result.mental}</div>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                            <div className="text-slate-400">满意</div>
                            <div className="font-bold text-slate-800">{srs22Result.satisfaction}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isDoctor && !hideLivePreviewPoint && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">本次随访属于哪个阶段</label>
                      <select
                        value={followUpStage}
                        onChange={(e) => setFollowUpStage(e.target.value)}
                        className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="术前基线评估">术前基线评估</option>
                        <option value="术后1周随访">术后1周随访</option>
                        <option value="术后1个月随访">术后1个月随访</option>
                        <option value="术后3个月随访">术后3个月随访</option>
                        <option value="术后6个月随访">术后6个月随访</option>
                        <option value="术后1年随访">术后1年随访</option>
                        <option value="术后1年半随访">术后1年半随访</option>
                        <option value="术后2年随访">术后2年随访</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">填写日期</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    返回修改问卷
                  </button>
                  <button
                    onClick={handleSaveFollowUpRecord}
                    disabled={isSaving || hideLivePreviewPoint}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-sm flex items-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {hideLivePreviewPoint
                      ? '本次评估已保存'
                      : isDoctor
                      ? `将本次评估结果归档存入【${selectedPatient?.name}】病例库`
                      : '提交本次评估结果'}
                  </button>
                </div>
              </div>

              {/* 右栏 (6列)：历史变化曲线图 + 历次随访对比表 */}
              <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                <VasHistoryChart records={combinedHistoryRecords} spineRegion={spineRegion} />

                {/* 历次随访明细对比表 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        患者【{selectedPatient?.name}】历次随访时间点纵向对比表
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isDoctor ? '可点击右侧“删除”按钮单独删除某一次随访内容' : '这是您历次随访的评分变化，删除或修改请联系医生'}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      共 {combinedHistoryRecords.length} 个随访时间点
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="py-2 px-2.5 font-bold">随访阶段</th>
                          <th className="py-2 px-2 font-bold">日期</th>
                          <th className="py-2 px-2 font-bold text-indigo-600">
                            {spineRegion === 'cervical' ? '颈VAS' : '腰VAS'}
                          </th>
                          <th className="py-2 px-2 font-bold text-emerald-600">
                            {spineRegion === 'cervical' ? '上肢VAS' : '腿VAS'}
                          </th>
                          <th className="py-2 px-2 font-bold">
                            {spineRegion === 'cervical' ? 'NDI(%)' : 'ODI(%)'}
                          </th>
                          <th className="py-2 px-2 font-bold">PCS</th>
                          <th className="py-2 px-2 font-bold">MCS</th>
                          <th className="py-2 px-2 font-bold text-rose-600">
                            {spineRegion === 'cervical' ? '颈JOA' : '外观满意度'}
                          </th>
                          <th className="py-2 px-2 font-bold text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {combinedHistoryRecords.map((r, i) => {
                          const isCurrent = r.recordId === 'LIVE-CURRENT';
                          return (
                            <tr
                              key={r.recordId || i}
                              className={isCurrent ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'}
                            >
                              <td className="py-2 px-2.5 text-slate-900">
                                {r.stage}
                              </td>
                              <td className="py-2 px-2 text-slate-500">{r.date}</td>
                              <td className="py-2 px-2 text-indigo-700 font-bold">
                                {spineRegion === 'cervical' ? (r.neckVas ?? r.backVas) : r.backVas}
                              </td>
                              <td className="py-2 px-2 text-emerald-700 font-bold">
                                {spineRegion === 'cervical' ? (r.armVas ?? r.legVas) : r.legVas}
                              </td>
                              <td className="py-2 px-2 text-slate-800">
                                {spineRegion === 'cervical' ? (r.ndi ?? r.odi) : r.odi}
                              </td>
                              <td className="py-2 px-2 text-slate-800">{r.pcs}</td>
                              <td className="py-2 px-2 text-slate-800">{r.mcs}</td>
                              <td className="py-2 px-2 text-rose-700 font-bold">
                                {spineRegion === 'cervical'
                                  ? `${r.joa ?? 15}/17分`
                                  : r.srsImage === '已跳过' || r.srsImage === '不适用'
                                  ? r.srsImage
                                  : `${r.srsImage}分`}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {(isDoctor || isCurrent) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openAdminAuthModal({
                                      actionType: 'delete_record',
                                      title: isCurrent ? '移除本次未提交的预览点' : '确认删除该次随访内容',
                                      description: isCurrent
                                        ? '本次评估尚未保存，仅从曲线和列表中移除预览，不影响已保存数据。'
                                        : `您即将从云端数据库永久删除随访时间点【${r.stage} (${r.date})】的记录，删除后无法恢复。`,
                                      payload: {
                                        patientId: selectedPatient?.id,
                                        recordId: r.recordId
                                      }
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  {isCurrent ? '移除' : '删除'}
                                </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>)}
      </main>

      {/* ================================================================
          管理员密码验证模态框（用于显示全部隐私信息、删除病例、删除某次随访内容）
         ================================================================ */}
      {adminModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{adminModal.title}</h3>
                  <p className="text-[11px] text-slate-400">请确认后再继续</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAdminAuthModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{adminModal.description}</p>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-3">
              {adminModal.errorMsg && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {adminModal.errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAdminAuthModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  autoFocus
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  确认删除
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 扫码登录二维码（医生建档后给患者扫） */}
      {qrModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-3 text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
                患者扫码填写随访问卷
              </h3>
              <button
                type="button"
                onClick={() => setQrModal({ open: false, dataUrl: '', patient: null })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={qrModal.dataUrl} alt="扫码登录" className="w-64 h-64 mx-auto" />
            <p className="text-xs text-slate-600 leading-relaxed">
              请【{qrModal.patient?.name}】用手机扫码，直接填写问卷，无需登录。
            </p>
            <p className="text-[11px] text-slate-400">每次重新生成二维码，旧二维码都会失效，请用最新的这一个。</p>
            <p className="text-[11px] text-slate-400 break-all">{qrModal.url}</p>
          </div>
        </div>
      )}
    </div>
  );
}