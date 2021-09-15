import { Pool } from 'services/observables/tokens';
import { Tooltip } from 'components/tooltip/Tooltip';
import { CountdownTimer } from 'components/countdownTimer/CountdownTimer';
import { ReactComponent as IconClock } from 'assets/icons/clock.svg';

export const PoolsTableCellRewards = (pool: Pool) => {
  const aprOne = pool.reserves[0].rewardApr;
  const aprTwo = pool.reserves[1].rewardApr;
  const symbolOne = pool.reserves[0].symbol;
  const symbolTwo = pool.reserves[1].symbol;
  const ends_at = pool.reward?.ends_at;
  return aprOne && aprTwo && ends_at ? (
    <div className="flex items-center">
      <Tooltip
        content={
          <span>
            Rewards end in <CountdownTimer date={ends_at} />
          </span>
        }
        button={<IconClock className="w-10" />}
      />
      <span className="ml-10">{`${symbolOne} ${aprOne.toFixed(2)}%`}</span>
      <span className="px-10">|</span>
      <span>{`${symbolTwo} ${aprTwo.toFixed(2)}%`}</span>
    </div>
  ) : (
    ''
  );
};
