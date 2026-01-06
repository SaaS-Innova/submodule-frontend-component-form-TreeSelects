import { IFormProps } from "../formInterface/forms.model";

export interface ITreeSelects extends IFormProps {
  showMarkAllHeader?: boolean;
  isSetCustomIcon?: boolean;
  customIcon?: JSX.Element | string;
}
