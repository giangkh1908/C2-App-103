# Grade 2 Visual Audit

Date: 2026-06-26

## Summary

Grade 2 already has broad frontend visual coverage in `frontend/src/components/visuals/index.ts`.
The main gap is backend curriculum routing: there is no `G2-*` curriculum adapter path yet, so these
visuals are not selected end-to-end for Grade 2 lessons.

## Components already available but not routed by Grade 2 curriculum

- `place_value_blocks`
- `number_line`
- `comparison_visual`
- `counting_objects`
- `grouping_model`
- `operation_story`
- `array_model`
- `bar_model`
- `geometry_shape`
- `shape_sorting`
- `real_object_match`
- `shape_composition`
- `drag_drop_shapes`
- `ruler_measurement`
- `clock_calendar`
- `mass_capacity_visual`
- `money_visual`
- `polyline_length_visual`
- `picture_graph`
- `data_table`
- `probability_experiment`
- `scenario_cards`
- `ten_frame`

## Missing backend routing

These Grade 2 curriculum topics exist in `backend/data/curriculum/chuong_trinh_toan_tieu_hoc.md` but do
not have dedicated curriculum adapter support yet:

- `G2-NUM-01`
- `G2-NUM-02`
- `G2-NUM-03`
- `G2-OPS-01`
- `G2-OPS-02`
- `G2-OPS-03`
- `G2-WORD-01`
- `G2-GEO-01`
- `G2-GEO-02`
- `G2-MEAS-01`
- `G2-MEAS-02`
- `G2-STAT-01`
- `G2-PROB-01`

## Suggested next branch

- Add `G2-*` curriculum mappings and prompt examples in the curriculum adapter.
- Reuse existing frontend components first; only add new visuals if testing finds real rendering gaps.
- Keep the implementation isolated to curriculum adapter, lesson visual type allowlists, and targeted tests.
