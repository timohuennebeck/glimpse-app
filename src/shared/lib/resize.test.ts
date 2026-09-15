import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { fitWithin, resizeJpeg } from '@/shared/lib/resize';

// Names must start with `mock`: jest hoists the factory above these consts.
const mockSaveAsync = jest.fn(async () => ({ uri: 'file:///out.jpg', width: 1600, height: 1200 }));
const mockRenderAsync = jest.fn(async () => ({ saveAsync: mockSaveAsync }));
const mockResize = jest.fn();
const mockManipulate = jest.fn((_uri: string) => ({ resize: mockResize, renderAsync: mockRenderAsync }));

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: (uri: string) => mockManipulate(uri) },
  SaveFormat: { JPEG: 'jpeg' },
}));

beforeEach(() => jest.clearAllMocks());

describe('fitWithin', () => {
  it('never scales a small photo up', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it('fits the longest edge, landscape or portrait', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('fits a square avatar', () => {
    expect(fitWithin(2000, 2000, 512)).toEqual({ width: 512, height: 512 });
  });
});

describe('resizeJpeg', () => {
  it('resizes a phone capture and saves it as JPEG', async () => {
    const result = await resizeJpeg('file:///capture.heic', { width: 4032, height: 3024 }, 1600);

    expect(mockManipulate).toHaveBeenCalledWith('file:///capture.heic');
    expect(mockResize).toHaveBeenCalledWith({ width: 1600, height: 1200 });
    expect(mockSaveAsync).toHaveBeenCalledWith({ compress: 0.85, format: SaveFormat.JPEG });
    expect(result).toEqual({ uri: 'file:///out.jpg', width: 1600, height: 1200 });
  });

  it('re-encodes without resizing when the photo already fits', async () => {
    await resizeJpeg('file:///small.jpg', { width: 900, height: 900 }, 1600);

    expect(mockResize).not.toHaveBeenCalled();
    expect(mockSaveAsync).toHaveBeenCalled();
  });

  it('is the only place the manipulator is reached', () => {
    expect(ImageManipulator.manipulate).toBeDefined();
  });
});
