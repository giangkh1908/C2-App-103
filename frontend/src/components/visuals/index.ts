'use client';

import type { VisualComponent } from './shared';

import NumberLineVisual from './NumberLineVisual';
import TenFrameVisual from './TenFrameVisual';
import PlaceValueVisual from './PlaceValueVisual';
import GroupingModelVisual from './GroupingModelVisual';
import StickBundlesVisual from './StickBundlesVisual';

// Batch 1: Math Operations
import CountingObjectsVisual from './CountingObjectsVisual';
import BarModelVisual from './BarModelVisual';
import ArrayModelVisual from './ArrayModelVisual';
import ComparisonVisual from './ComparisonVisual';
import RoundingVisual from './RoundingVisual';
import BalanceModelVisual from './BalanceModelVisual';
import ExpressionTreeVisual from './ExpressionTreeVisual';
import ParityVisual from './ParityVisual';
import MeanBalanceVisual from './MeanBalanceVisual';
import AreaModelDistributiveVisual from './AreaModelDistributiveVisual';
import UnitRateVisual from './UnitRateVisual';
import OperationStoryVisual from './OperationStoryVisual';

// Batch 2: Fraction/Decimal
import FractionBarVisual from './FractionBarVisual';
import FractionCircleVisual from './FractionCircleVisual';
import EquivalentFractionVisual from './EquivalentFractionVisual';
import DecimalPlaceValueVisual from './DecimalPlaceValueVisual';
import AreaModelDecimalVisual from './AreaModelDecimalVisual';
import PercentBarVisual from './PercentBarVisual';
import RatioModelVisual from './RatioModelVisual';

// Batch 3: Data/Statistics
import DataTableVisual from './DataTableVisual';
import BarChartVisual from './BarChartVisual';
import PieChartVisual from './PieChartVisual';
import PictureGraphVisual from './PictureGraphVisual';
import ProbabilityExperimentVisual from './ProbabilityExperimentVisual';
import ScenarioCardsVisual from './ScenarioCardsVisual';

// Batch 4: Measurement
import RulerMeasurementVisual from './RulerMeasurementVisual';
import ClockCalendarVisual from './ClockCalendarVisual';
import MoneyVisual from './MoneyVisual';
import ThermometerVisual from './ThermometerVisual';
import MassCapacityVisual from './MassCapacityVisual';
import VolumeCubesVisual from './VolumeCubesVisual';
import SpeedDistanceTimeVisual from './SpeedDistanceTimeVisual';
import PolylineLengthVisual from './PolylineLengthVisual';

// Batch 5: Geometry
import GeometryShapeVisual from './GeometryShapeVisual';
import SpatialPositionSceneVisual from './SpatialPositionSceneVisual';
import ShapeSortingVisual from './ShapeSortingVisual';
import RealObjectMatchVisual from './RealObjectMatchVisual';
import ShapeCompositionVisual from './ShapeCompositionVisual';
import DragDropShapesVisual from './DragDropShapesVisual';
import AngleProtractorVisual from './AngleProtractorVisual';
import ShapeAttributeHighlightVisual from './ShapeAttributeHighlightVisual';
import SolidShapeVisual from './SolidShapeVisual';
import ParallelPerpendicularVisual from './ParallelPerpendicularVisual';
import Net3dVisual from './Net3dVisual';
import AreaGridVisual from './AreaGridVisual';

// Batch 6: Special
import RomanNumeralVisual from './RomanNumeralVisual';
import CalculatorDemoVisual from './CalculatorDemoVisual';
import StepByStepInputVisual from './StepByStepInputVisual';

export const VISUAL_REGISTRY: Record<string, VisualComponent> = {
  // Existing
  number_line: NumberLineVisual,
  ten_frame: TenFrameVisual,
  place_value: PlaceValueVisual,
  place_value_blocks: PlaceValueVisual,
  grouping: GroupingModelVisual,
  grouping_model: GroupingModelVisual,

  // Batch 1: Math Operations
  counting_objects: CountingObjectsVisual,
  stick_bundles: StickBundlesVisual,
  bar_model: BarModelVisual,
  array_model: ArrayModelVisual,
  comparison_visual: ComparisonVisual,
  rounding_visual: RoundingVisual,
  balance_model: BalanceModelVisual,
  expression_tree: ExpressionTreeVisual,
  parity_visual: ParityVisual,
  mean_balance_visual: MeanBalanceVisual,
  area_model_distributive: AreaModelDistributiveVisual,
  unit_rate_visual: UnitRateVisual,
  operation_story: OperationStoryVisual,

  // Batch 2: Fraction/Decimal
  fraction_bar: FractionBarVisual,
  fraction_circle: FractionCircleVisual,
  equivalent_fraction_visual: EquivalentFractionVisual,
  decimal_place_value: DecimalPlaceValueVisual,
  area_model_decimal: AreaModelDecimalVisual,
  percent_bar: PercentBarVisual,
  ratio_model: RatioModelVisual,

  // Batch 3: Data/Statistics
  data_table: DataTableVisual,
  bar_chart: BarChartVisual,
  pie_chart: PieChartVisual,
  picture_graph: PictureGraphVisual,
  probability_experiment: ProbabilityExperimentVisual,
  scenario_cards: ScenarioCardsVisual,

  // Batch 4: Measurement
  ruler_measurement: RulerMeasurementVisual,
  clock_calendar: ClockCalendarVisual,
  money_visual: MoneyVisual,
  thermometer_visual: ThermometerVisual,
  mass_capacity_visual: MassCapacityVisual,
  volume_cubes: VolumeCubesVisual,
  speed_distance_time_visual: SpeedDistanceTimeVisual,
  polyline_length_visual: PolylineLengthVisual,

  // Batch 5: Geometry
  geometry_shape: GeometryShapeVisual,
  spatial_position_scene: SpatialPositionSceneVisual,
  shape_sorting: ShapeSortingVisual,
  real_object_match: RealObjectMatchVisual,
  shape_composition: ShapeCompositionVisual,
  drag_drop_shapes: DragDropShapesVisual,
  angle_protractor: AngleProtractorVisual,
  shape_attribute_highlight: ShapeAttributeHighlightVisual,
  solid_shape: SolidShapeVisual,
  parallel_perpendicular_visual: ParallelPerpendicularVisual,
  net_3d_visual: Net3dVisual,
  area_grid: AreaGridVisual,

  // Batch 6: Special
  roman_numeral_visual: RomanNumeralVisual,
  calculator_demo: CalculatorDemoVisual,
  step_by_step_input: StepByStepInputVisual,
};

export default VISUAL_REGISTRY;
