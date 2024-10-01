'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { ExplorerLink } from '../cluster/cluster-ui';
import { WalletButton } from '../solana/solana-provider';
import { AppHero, ellipsify } from '../ui/ui-layout';
import { useRewardAgentProgram } from './reward-data-access';
import { RewardAgentCreate, RewardAgentProgram } from './reward_ui';

export default function BasicFeature() {
  const { publicKey } = useWallet();
  const { programId } = useRewardAgentProgram();

  return publicKey ? (
    <div>
      <AppHero
        title="Basic"
        subtitle={'Run the program by clicking the "Run program" button.'}
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
        <RewardAgentCreate />
      </AppHero>
      <RewardAgentProgram />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton className="btn btn-primary" />
        </div>
      </div>
    </div>
  );
}
