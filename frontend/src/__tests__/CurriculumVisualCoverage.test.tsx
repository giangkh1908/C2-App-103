import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ArrayModelVisual from '@/components/visuals/ArrayModelVisual';
import ClockCalendarVisual from '@/components/visuals/ClockCalendarVisual';
import CountingObjectsVisual from '@/components/visuals/CountingObjectsVisual';
import MassCapacityVisual from '@/components/visuals/MassCapacityVisual';
import MoneyVisual from '@/components/visuals/MoneyVisual';
import OperationStoryVisual from '@/components/visuals/OperationStoryVisual';
import PictureGraphVisual from '@/components/visuals/PictureGraphVisual';
import PlaceValueVisual from '@/components/visuals/PlaceValueVisual';
import ProbabilityExperimentVisual from '@/components/visuals/ProbabilityExperimentVisual';
import RulerMeasurementVisual from '@/components/visuals/RulerMeasurementVisual';

describe('Grade 1 visual coverage', () => {
  it('renders place value blocks from config values', () => {
    render(
      <PlaceValueVisual
        primaryCount={2}
        secondaryCount={4}
        totalCount={24}
        config={{ number: 24, tens: 2, ones: 4 }}
      />
    );

    expect(screen.getAllByText(/24/).length).toBeGreaterThan(0);
    expect(screen.getByText('chục')).toBeTruthy();
    expect(screen.getByText('đơn vị')).toBeTruthy();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
  });

  it('renders operation story values consistently', () => {
    render(
      <OperationStoryVisual
        primaryCount={24}
        secondaryCount={13}
        totalCount={37}
        groupsLabel="que tính"
        config={{ operation: '+', before: 24, change: 13, result: 37, story_context: 'que tính' }}
      />
    );

    expect(screen.getAllByText('24').length).toBeGreaterThan(0);
    expect(screen.getByText('+ 13')).toBeTruthy();
    expect(screen.getAllByText(/24/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/37/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Có 24 que tính, thêm 13 que tính, nên có 37 que tính./)).toBeTruthy();
  });

  it('renders ruler measurement from config length', () => {
    render(
      <RulerMeasurementVisual
        primaryCount={9}
        secondaryCount={0}
        totalCount={9}
        config={{ object_name: 'Cây bút', length_cm: 9 }}
      />
    );

    expect(screen.getByText('9 cm')).toBeTruthy();
    expect(screen.getByText(/Cây bút dài 9 cm/)).toBeTruthy();
  });

  it('renders clock time from hour and minute config', () => {
    render(
      <ClockCalendarVisual
        primaryCount={7}
        secondaryCount={0}
        totalCount={7}
        config={{ mode: 'clock', hour: 7, minute: 0 }}
      />
    );

    expect(screen.getByText('07:00')).toBeTruthy();
    expect(screen.getByText(/7 giờ 0 phút/)).toBeTruthy();
  });
});

describe('Grade 2 frontend visual coverage', () => {
  it('renders counting objects from group and item counts', () => {
    render(
      <CountingObjectsVisual
        primaryCount={3}
        secondaryCount={4}
        totalCount={12}
        groupsLabel="nhóm"
        itemsLabel="vật"
      />
    );

    expect(screen.getByText(/Tổng cộng: 12 vật/)).toBeTruthy();
  });

  it('renders an array model with the expected product', () => {
    render(<ArrayModelVisual primaryCount={4} secondaryCount={5} totalCount={20} />);

    expect(screen.getByText(/Mảng ô vuông: 4 × 5 = 20/)).toBeTruthy();
    expect(screen.getByText(/4 hàng × 5 cột = 20/)).toBeTruthy();
  });

  it('renders money visual totals from config denominations', () => {
    render(
      <MoneyVisual
        primaryCount={3}
        secondaryCount={0}
        totalCount={8000}
        config={{ denominations: [1000, 2000, 5000], total_value: 8000, currency: 'đồng' }}
      />
    );

    expect(screen.getByText(/Tổng cộng: 8.000 đồng/)).toBeTruthy();
    expect(screen.getByText(/Có 3 tờ tiền trong hình./)).toBeTruthy();
  });

  it('renders mass comparison without ambiguous fallback labels', () => {
    render(
      <MassCapacityVisual
        primaryCount={8}
        secondaryCount={5}
        totalCount={8}
        config={{ left_label: 'Bình A', right_label: 'Bình B', unit: 'kg', left_value: 8, right_value: 5 }}
      />
    );

    expect(screen.getByText(/Bình A nặng hơn/)).toBeTruthy();
    expect(screen.getByText(/8kg và 5kg/)).toBeTruthy();
  });

  it('renders picture graph totals consistently from config', () => {
    render(
      <PictureGraphVisual
        primaryCount={3}
        secondaryCount={2}
        totalCount={12}
        groupsLabel="Loại trái cây"
        itemsLabel="bạn"
        config={{ labels: ['Táo', 'Cam', 'Nho'], values: [4, 6, 2], unit_value: 2, icon_emoji: '⭐' }}
      />
    );

    expect(screen.getByText(/1 hình = 2 bạn/)).toBeTruthy();
    expect(screen.getByText(/Loại trái cây: 3 mục/)).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('renders probability outcomes from config', () => {
    render(
      <ProbabilityExperimentVisual
        primaryCount={5}
        secondaryCount={3}
        totalCount={5}
        config={{
          outcomes: ['Bóng đỏ', 'Bóng đỏ', 'Bóng đỏ', 'Bóng xanh', 'Bóng xanh'],
          favorable_count: 3,
          experiment_label: 'Bóng đỏ dễ xuất hiện hơn',
        }}
      />
    );

    expect(screen.getByText('3/5')).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByText(/Bóng đỏ dễ xuất hiện hơn: 3 \/ 5/)).toBeTruthy();
  });
});
