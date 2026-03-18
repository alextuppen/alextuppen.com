export interface Column {
  chars: string[];
  currentChar: number;
  charsRemaining: number;
  gradient: string[];
  fontSize: number;
  fontString: string;
  shadowBlur: number;
  xCoord: number;
  yCoord: number;
  prevRender: number;
  timeBetweenRenders: number;
}
