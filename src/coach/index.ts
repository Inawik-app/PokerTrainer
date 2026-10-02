/** Keep legacy getAdvice for simple call-spot messaging; new API is advise(). */
export {
  getAdvice,
  reviewHand,
  biggestMistake,
  type Advice,
  type HandDecisionReview,
} from "./advice";
export {
  advise,
  classifyBoard,
  type AdviseInput,
  type CoachAdvice,
  type AdviceConfidence,
  type RecommendedAction,
  type BoardTexture,
} from "./advise";
export {
  buildOpponentModels,
  createOpponentModel,
  ratesFromStats,
  effectiveProfile,
  confidenceFromHands,
  deduceProfile,
  type OpponentModel,
  type ObservedStats,
  type Confidence,
} from "./opponentModel";
export {
  estimatePreflopRange,
  estimateRangeForOpponent,
  narrowRangePostflop,
  type WeightedHand,
  type PositionBucket,
  type PreflopAction,
} from "./rangeEstimator";
export { computeEquityVsRanges, type RangeEquityResult } from "./equityVsRange";
export {
  reviewDecisions,
  formatAdviceBlock,
  confidenceToUi,
  type PlayerDecision,
  type HandReviewSummary,
  type DecisionGap,
} from "./handReview";
export {
  getBetZones,
  zoneAt,
  defaultAmountInGoodZone,
  type BetZone,
  type BetZoneKind,
  type BetZonesInput,
} from "./betZones";
