'use client'

import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'

export default function DistributionRulesPage() {
  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">分佣规则</h1>
          <Link href="/distribution" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">佣金比例</h2>
            <div className="text-white/70 text-sm space-y-1">
              <div>一级佣金: 10%</div>
              <div>二级佣金: 5%</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-2">佣金类型</h2>
            <div className="text-white/70 text-sm space-y-1">
              <div>• 充值订单佣金</div>
              <div>• 会员购买佣金</div>
              <div>• 算力购买佣金</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-2">提现规则</h2>
            <div className="text-white/70 text-sm space-y-1">
              <div>• 最低提现金额: ¥10.00</div>
              <div>• 提现手续费: 1%</div>
              <div>• 佣金结算周期: 订单完成后7天</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
