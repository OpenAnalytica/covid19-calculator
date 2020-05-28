import {
  ScoreCategory,
  ScorableCollection,
  ScoredData,
  LevelData,
} from './types';
import { ages } from './ages';
import { conditions } from './conditions';
import { exposures } from './exposures';
import { preExistingConditions } from './preExistingConditions';
import { symptoms } from './symptoms';

const scoreData = {
  ages,
  conditions,
  exposures,
  preExistingConditions,
  symptoms,
};

export const categories: ScoreCategory[] = [
  'likelihood',
  'exposure',
  'preExisting',
];
export const emptyScore: ScoredData = {
  likelihood: 0,
  preExisting: 0,
  exposure: 0,
};

type ScaleLevels = Readonly<Record<ScoreCategory, [string, number][]>>;

//TODO: It would be to have the types fall from the `scale` data
export type LikelihoodLevel =
  | 'veryLow'
  | 'low'
  | 'medium'
  | 'high'
  | 'veryHigh';
export type PreExitingLevel = 'low' | 'medium' | 'high';
export type ExposureLevel = 'low' | 'medium' | 'high';

export const scale: ScaleLevels = {
  likelihood: [
    ['veryLow', 0],
    ['low', 10],
    ['medium', 20],
    ['high', 40],
    ['veryHigh', 70],
  ],
  preExisting: [
    ['low', 0],
    ['medium', 10],
    ['high', 30],
  ],
  exposure: [
    ['low', 0],
    ['medium', 10],
    ['high', 30],
  ],
};

type DataType = typeof scoreData;
export type MyStatusData = Partial<
  {
    [K in keyof DataType]: string[];
  }
>;

const mergeScores = (...args: Partial<ScoredData>[]): ScoredData =>
  args.reduce<ScoredData>(
    (total, next) => ({
      likelihood: (total.likelihood ?? 0) + (next.likelihood ?? 0),
      exposure: (total.exposure ?? 0) + (next.exposure ?? 0),
      preExisting: (total.preExisting ?? 0) + (next.preExisting ?? 0),
    }),
    emptyScore
  );

export const calculateScore = (
  values: string[],
  collection: ScorableCollection<string>
): ScoredData =>
  mergeScores(
    ...collection.filter(collection => values.includes(collection.key))
  );

export const calculateScores = (dataToScore: MyStatusData) => {
  const {
    exposures = [],
    preExistingConditions = [],
    conditions = [],
    symptoms = [],
  } = dataToScore;

  const scores = mergeScores(
    calculateScore(exposures, scoreData.exposures),
    calculateScore(preExistingConditions, scoreData.preExistingConditions),
    calculateScore(conditions, scoreData.conditions),
    calculateScore(symptoms, scoreData.symptoms)
  );

  return scores;
};

export const calculateLevel = (category: ScoreCategory, score: number) => {
  if (scale[category] === undefined) {
    throw new Error(
      `Category is unknown. Must be one of: ${categories.join(', ')}`
    );
  }
  const [lowest, ...rest] = scale[category];
  let result = lowest[0];

  for (let [level, threshold] of rest) {
    if (score > threshold) {
      result = level;
    }
  }
  // return lowest level
  return result;
};

export const calculateLevels = (scores: ScoredData): LevelData =>
  categories.reduce((levels, category) => {
    return {
      ...levels,
      [category]: calculateLevel(category, scores[category] ?? 0),
    };
  }, {} as LevelData);

export const calculate = (dataToScore: MyStatusData) => {
  const scores = calculateScores(dataToScore);

  const levels = calculateLevels(scores);

  return { scores, levels };
};
