import React from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  Box,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

/**
 * Çeşitli form alanları için genel bileşen
 * 
 * @param {Object} props
 * @param {string} props.id - Form alanı ID'si
 * @param {string} props.label - Form alanı etiketi
 * @param {string} props.type - Input türü (text, email, password, textarea, select, checkbox, switch)
 * @param {string} props.value - Form alanı değeri
 * @param {Function} props.onChange - Değişiklik fonksiyonu
 * @param {string} props.placeholder - Placeholder metni
 * @param {string} props.error - Hata mesajı
 * @param {string} props.helperText - Yardımcı metin
 * @param {Array} props.options - Select için seçenekler ([{value, label}])
 * @param {boolean} props.isRequired - Gerekli alan mı
 * @param {boolean} props.isDisabled - Devre dışı mı
 * @param {boolean} props.isReadOnly - Sadece okunabilir mi
 * @param {Function} props.onBlur - Blur fonksiyonu
 * @param {Object} props.leftElement - Sol element (InputLeftElement içeriği)
 * @param {Object} props.rightElement - Sağ element (InputRightElement içeriği)
 * @param {string} props.tooltip - Tooltip metni
 */
const FormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  options = [],
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  onBlur,
  leftElement,
  rightElement,
  tooltip,
  ...rest
}) => {
  // Form alanı türünü render et
  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            onBlur={onBlur}
            {...rest}
          />
        );
        
      case 'select':
        return (
          <Select
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            onBlur={onBlur}
            {...rest}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
        
      case 'checkbox':
        return (
          <Checkbox
            id={id}
            isChecked={value}
            onChange={onChange}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            {...rest}
          >
            {label}
          </Checkbox>
        );
        
      case 'switch':
        return (
          <Switch
            id={id}
            isChecked={value}
            onChange={onChange}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            {...rest}
          />
        );
        
      default: // text, email, password, number, etc.
        return (
          <InputGroup>
            {leftElement && <InputLeftElement>{leftElement}</InputLeftElement>}
            <Input
              id={id}
              type={type}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              onBlur={onBlur}
              {...rest}
            />
            {rightElement && <InputRightElement>{rightElement}</InputRightElement>}
          </InputGroup>
        );
    }
  };

  return (
    <FormControl
      isInvalid={!!error}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      mb={4}
    >
      {type !== 'checkbox' && (
        <FormLabel htmlFor={id}>
          {label}
          {tooltip && (
            <Tooltip label={tooltip}>
              <Box as="span" ml={1} color="gray.500">
                <Icon as={InfoIcon} boxSize={3} />
              </Box>
            </Tooltip>
          )}
        </FormLabel>
      )}
      
      {renderField()}
      
      {error ? (
        <FormErrorMessage>{error}</FormErrorMessage>
      ) : (
        helperText && <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

export default FormField;