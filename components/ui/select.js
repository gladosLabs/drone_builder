import { useState, useRef, useEffect } from "react";

export function Select({ 
  children, 
  className = "", 
  value = "", 
  onChange, 
  placeholder = "Select an option",
  multiple = false,
  searchable = false,
  onContactUs,
  ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState(multiple ? (Array.isArray(value) ? value : []) : []);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue, optionText) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(newValues);
      onChange?.({ target: { value: newValues } });
    } else {
      onChange?.({ target: { value: optionValue } });
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const handleContactUs = () => {
    setIsOpen(false);
    const currentSearchTerm = searchTerm;
    setSearchTerm("");
    onContactUs?.(currentSearchTerm);
  };

  const removeSelected = (valueToRemove) => {
    const newValues = selectedValues.filter(v => v !== valueToRemove);
    setSelectedValues(newValues);
    onChange?.({ target: { value: newValues } });
  };

  const getDisplayValue = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const option = Array.from(children).find(child => child.props.value === selectedValues[0]);
        return option?.props.children || selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    }
    
    if (!value) return placeholder;
    const option = Array.from(children).find(child => child.props.value === value);
    return option?.props.children || value;
  };

  const filteredOptions = Array.from(children).filter(child => {
    if (!searchTerm) return true;
    const optionText = child.props.children?.toLowerCase() || "";
    return optionText.includes(searchTerm.toLowerCase());
  });

  const hasExactMatch = filteredOptions.some(child => 
    child.props.children?.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white transition-all duration-200 hover:border-gray-400 shadow-sm cursor-pointer ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {multiple && selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {selectedValues.slice(0, 2).map(val => {
                  const option = Array.from(children).find(child => child.props.value === val);
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {option?.props.children || val}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelected(val);
                        }}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {selectedValues.length > 2 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    +{selectedValues.length - 2} more
                  </span>
                )}
              </div>
            )}
            <span className={`block truncate ${multiple && selectedValues.length > 0 ? 'text-sm' : 'text-base'}`}>
              {getDisplayValue()}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-hidden">
          {(multiple || searchable) && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder={multiple ? "Search options..." : "Search drone types..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((child, index) => (
                <div
                  key={child.props.value || index}
                  className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                    (multiple ? selectedValues.includes(child.props.value) : value === child.props.value)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-900'
                  }`}
                  onClick={() => handleSelect(child.props.value, child.props.children)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{child.props.children}</span>
                    {(multiple ? selectedValues.includes(child.props.value) : value === child.props.value) && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">No options found</div>
            )}
            
            {/* Contact Us option when searching and no exact match found */}
            {searchable && searchTerm && !hasExactMatch && filteredOptions.length === 0 && onContactUs && (
              <div
                className="px-4 py-3 cursor-pointer hover:bg-orange-50 transition-colors border-t border-gray-100"
                onClick={handleContactUs}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-orange-600 font-medium">Contact Us</span>
                  </div>
                  <span className="text-xs text-gray-500">Can't find "{searchTerm}"?</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 