import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatToWear from './WhatToWear';
import type { CurrentWeather } from '@mycircle/shared';

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'weather.whatToWear': 'What to Wear',
      'wear.suggestions': 'suggestions',
      'wear.comfortExtremeCold': 'Extreme Cold',
      'wear.comfortCold': 'Cold',
      'wear.comfortCool': 'Cool',
      'wear.comfortComfortable': 'Comfortable',
      'wear.comfortWarm': 'Warm',
      'wear.comfortHot': 'Hot',
      'wear.catTops': 'Tops',
      'wear.catBottoms': 'Bottoms',
      'wear.catFootwear': 'Footwear',
      'wear.catAccessories': 'Accessories',
      'wear.catProtection': 'Protection',
      'wear.catTips': 'Tips',
      'wear.heavyWinterCoat': 'Heavy winter coat',
      'wear.thermalBaseLayer': 'Thermal base layer',
      'wear.fleeceMiddleLayer': 'Fleece middle layer',
      'wear.winterCoat': 'Winter coat',
      'wear.warmJacket': 'Warm jacket',
      'wear.layeredTop': 'Layered top',
      'wear.lightJacketSweater': 'Light jacket or sweater',
      'wear.longSleeveShirt': 'Long sleeve shirt',
      'wear.tshirtLightShirt': 'T-shirt or light shirt',
      'wear.lightBreathable': 'Light breathable clothing',
      'wear.uvProtectiveShirt': 'UV protective shirt',
      'wear.tankTopSleeveless': 'Tank top or sleeveless',
      'wear.minimalLight': 'Minimal light clothing',
      'wear.insulatedPants': 'Insulated pants',
      'wear.thermalLeggings': 'Thermal leggings',
      'wear.longPants': 'Long pants',
      'wear.jeansPants': 'Jeans or pants',
      'wear.lightPantsJeans': 'Light pants or jeans',
      'wear.shorts': 'Shorts',
      'wear.lightLinenPants': 'Light linen pants',
      'wear.winterBoots': 'Winter boots',
      'wear.woolSocks': 'Wool socks',
      'wear.waterproofBoots': 'Waterproof boots',
      'wear.closedShoes': 'Closed shoes',
      'wear.sneakers': 'Sneakers',
      'wear.openShoesSandals': 'Open shoes or sandals',
      'wear.insulatedGloves': 'Insulated gloves',
      'wear.scarfWarmHat': 'Scarf and warm hat',
      'wear.faceCovering': 'Face covering',
      'wear.gloves': 'Gloves',
      'wear.scarf': 'Scarf',
      'wear.warmHat': 'Warm hat',
      'wear.lightScarf': 'Light scarf',
      'wear.beanie': 'Beanie',
      'wear.sunglasses': 'Sunglasses',
      'wear.hatSunProtection': 'Hat for sun protection',
      'wear.snowGoggles': 'Snow goggles',
      'wear.umbrella': 'Umbrella',
      'wear.waterproofJacket': 'Waterproof jacket',
      'wear.waterproofPants': 'Waterproof pants',
      'wear.windbreaker': 'Windbreaker',
      'wear.sunscreen': 'Sunscreen',
      'wear.moistureWicking': 'Moisture-wicking fabric',
      'wear.looseFittingClothes': 'Loose-fitting clothes',
      'wear.waterBottle': 'Water bottle',
      'wear.cottonOrLinen': 'Cotton or linen',
      'wear.coolingTowel': 'Cooling towel',
      'wear.secureFittingClothes': 'Secure-fitting clothes',
      'wear.dressInLayers': 'Dress in layers',
      'wear.brightReflective': 'Bright/reflective gear',
    };
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t, locale: 'en-US' }),
  };
});

function makeWeather(overrides: Partial<CurrentWeather> = {}): CurrentWeather {
  return {
    temp: 22,
    feels_like: 20,
    temp_min: 18,
    temp_max: 25,
    pressure: 1013,
    humidity: 50,
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    wind: { speed: 3, deg: 180 },
    clouds: { all: 10 },
    dt: 1620000000,
    timezone: 0,
    ...overrides,
  };
}

describe('WhatToWear', () => {
  it('renders heading and comfort label', () => {
    render(<WhatToWear data={makeWeather()} />);

    expect(screen.getByText('What to Wear')).toBeInTheDocument();
  });

  it('shows total suggestions count', () => {
    render(<WhatToWear data={makeWeather()} />);

    expect(screen.getByText(/suggestions/)).toBeInTheDocument();
  });

  it('can be collapsed and expanded', () => {
    render(<WhatToWear data={makeWeather()} />);

    // Categories should be visible by default
    expect(screen.getByText('Tops')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse');
    fireEvent.click(collapseButton);

    // Categories should be hidden
    expect(screen.queryByText('Tops')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByLabelText('Expand');
    fireEvent.click(expandButton);

    // Categories should be visible again
    expect(screen.getByText('Tops')).toBeInTheDocument();
  });

  // --- Cold weather ---
  it('suggests heavy winter gear for extreme cold (temp <= -10)', () => {
    render(<WhatToWear data={makeWeather({ temp: -15, humidity: 40, wind: { speed: 3, deg: 0 } })} />);

    expect(screen.getByText('Heavy winter coat')).toBeInTheDocument();
    expect(screen.getByText('Thermal base layer')).toBeInTheDocument();
    expect(screen.getByText('Fleece middle layer')).toBeInTheDocument();
    expect(screen.getByText('Insulated pants')).toBeInTheDocument();
    expect(screen.getByText('Winter boots')).toBeInTheDocument();
    expect(screen.getByText('Wool socks')).toBeInTheDocument();
    expect(screen.getByText('Insulated gloves')).toBeInTheDocument();
  });

  it('suggests winter coat for cold weather (temp <= 0)', () => {
    render(<WhatToWear data={makeWeather({ temp: -3, humidity: 40, wind: { speed: 3, deg: 0 } })} />);

    expect(screen.getByText('Winter coat')).toBeInTheDocument();
    expect(screen.getByText('Gloves')).toBeInTheDocument();
    expect(screen.getByText('Scarf')).toBeInTheDocument();
  });

  it('suggests warm jacket for cool weather (temp <= 10)', () => {
    render(<WhatToWear data={makeWeather({ temp: 8, humidity: 50, wind: { speed: 3, deg: 0 } })} />);

    expect(screen.getByText('Warm jacket')).toBeInTheDocument();
    expect(screen.getByText('Layered top')).toBeInTheDocument();
    expect(screen.getByText('Closed shoes')).toBeInTheDocument();
  });

  // --- Hot weather ---
  it('suggests light clothing for hot weather (temp 26-35)', () => {
    render(<WhatToWear data={makeWeather({ temp: 30, humidity: 40 })} />);

    expect(screen.getByText('Light breathable clothing')).toBeInTheDocument();
    expect(screen.getByText('Shorts')).toBeInTheDocument();
  });

  it('suggests minimal clothing for extreme heat (temp > 35)', () => {
    render(<WhatToWear data={makeWeather({ temp: 38, humidity: 40 })} />);

    expect(screen.getByText('Tank top or sleeveless')).toBeInTheDocument();
    expect(screen.getByText('Minimal light clothing')).toBeInTheDocument();
  });

  it('suggests sunscreen and sunglasses for hot clear weather', () => {
    render(<WhatToWear data={makeWeather({
      temp: 30,
      humidity: 40,
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    })} />);

    expect(screen.getByText('Sunglasses')).toBeInTheDocument();
    expect(screen.getByText('Hat for sun protection')).toBeInTheDocument();
    expect(screen.getByText('Sunscreen')).toBeInTheDocument();
  });

  // --- Rain gear ---
  it('suggests rain gear when weather is rainy', () => {
    render(<WhatToWear data={makeWeather({
      temp: 15,
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
    })} />);

    expect(screen.getByText('Umbrella')).toBeInTheDocument();
    expect(screen.getByText('Waterproof jacket')).toBeInTheDocument();
    expect(screen.getByText('Waterproof boots')).toBeInTheDocument();
  });

  it('suggests waterproof pants for heavy rain/thunderstorm', () => {
    render(<WhatToWear data={makeWeather({
      temp: 20,
      weather: [{ id: 211, main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' }],
    })} />);

    expect(screen.getByText('Waterproof pants')).toBeInTheDocument();
  });

  // --- Wind ---
  it('suggests windbreaker for windy conditions (non-rainy)', () => {
    render(<WhatToWear data={makeWeather({
      temp: 20,
      wind: { speed: 12, deg: 180 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    })} />);

    expect(screen.getByText('Windbreaker')).toBeInTheDocument();
    expect(screen.getByText('Secure-fitting clothes')).toBeInTheDocument();
  });

  // --- Comfort label ---
  it('shows "Comfortable" comfort label for moderate weather', () => {
    render(<WhatToWear data={makeWeather({ temp: 22, humidity: 50, wind: { speed: 3, deg: 0 } })} />);

    expect(screen.getByText('Comfortable')).toBeInTheDocument();
  });

  it('shows "Cold" comfort label for cold weather', () => {
    render(<WhatToWear data={makeWeather({ temp: 0, humidity: 50, wind: { speed: 3, deg: 0 } })} />);

    expect(screen.getByText('Cold')).toBeInTheDocument();
  });

  it('shows "Hot" comfort label for very hot weather', () => {
    render(<WhatToWear data={makeWeather({ temp: 38, humidity: 50, wind: { speed: 3, deg: 0 } })} />);

    expect(screen.getByText('Hot')).toBeInTheDocument();
  });

  // --- Layers tip ---
  it('suggests dressing in layers for mild-cool weather (5-18C)', () => {
    render(<WhatToWear data={makeWeather({ temp: 12, humidity: 50, wind: { speed: 3, deg: 0 } })} />);

    expect(screen.getByText('Dress in layers')).toBeInTheDocument();
  });
});
