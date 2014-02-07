/*

 HIBC Decoder

 decode(barcode)
 isMatch(decodedLine1, decodedLine2)
 errors
 type

 */


(function () {
    var error = {
        BarcodeNotAString: 1,
        EmptyBarcode: 2,
        BarcodeNotHIBC: 3,
        InvalidBarcode: 4,
        InvalidDate: 5,
        EmptyCheckCharacter: 6,
        EmptyLinkCharacter: 7,
        InvalidQuantity: 8,
        InvalidLine1: 9
    };

    var type = {
        Concatenated: 1,
        Line1: 2,
        Line2: 3
    };

    function decode(barcode) {
        var decoded = {
            barcode: _.clone(barcode)
        };

        if (!_.isString(barcode)) {
            decoded.error = error.BarcodeNotAString;
            return decoded;
        }

        // remove leading *
        if (barcode.charAt(0) === "*") {
            barcode = barcode.substring(1);
            if (_.isEmpty(barcode)) {
                decoded.error = error.EmptyBarcode;
                return decoded;
            }
        }

        // remove trailing *
        if (barcode.charAt(barcode.length - 1) === "*") {
            barcode = barcode.substring(0, barcode.length - 1);
            if (_.isEmpty(barcode)) {
                decoded.error = error.EmptyBarcode;
                return decoded;
            }
        }

        // Check for + character
        if (barcode.charAt(0) !== "+") {
            decoded.error = error.BarcodeNotHIBC;
            return decoded;
        } else {
            barcode = barcode.substring(1);
        }

        // minimum barcode length
        if (barcode.length < 4) {
            decoded.error = error.InvalidBarcode;
            return decoded;
        }

        // Check and Link characters can contain a "/" so remove them to not affect the split
        var potentialCheckAndLinkCharacters = barcode.substring(barcode.length - 2);
        barcode = barcode.substring(0, barcode.length - 2);

        var array = barcode.split("/");
        if (array.length === 1) {
            if (matchesLetters(array[0].charAt(0))) {
                decoded = processLine1(decoded, type.Line1, array[0] + potentialCheckAndLinkCharacters);
            } else {
                decoded = processLine2(decoded, type.Line2, array[0] + potentialCheckAndLinkCharacters);
            }
            return decoded;
        } else if (array.length == 2) {
            decoded = processLine1(decoded, type.Concatenated, array[0]);
            angular.extend(decoded, processLine2({}, type.Concatenated, array[1] + potentialCheckAndLinkCharacters));
            return decoded;
        } else {
            decoded.error = error.InvalidBarcode;
            return decoded;
        }
    }

    function processLine1(decoded, t, barcode) {
        decoded.type = t;
        if (barcode.length < 4) {
            decoded.error = error.InvalidLine1;
            return decoded;
        }

        decoded.labelerId = barcode.substring(0, 4);
        barcode = barcode.substring(4);

        if (_.isEmpty(barcode)) {
            decoded.error = error.InvalidLine1;
            return decoded;
        }

        // if Concatenated the check char is in the second part of the barcode
        if (decoded.type !== type.Concatenated) {
            decoded.check = barcode.charAt(barcode.length - 1);
            barcode = barcode.substring(0, barcode.length - 1);
            if (_.isEmpty(barcode)) {
                decoded.error = error.InvalidLine1;
                return decoded;
            }
        }

        decoded.uom = parseInt(barcode.charAt(barcode.length - 1), 10);
        barcode = barcode.substring(0, barcode.length - 1);
        if (_.isEmpty(barcode)) {
            decoded.error = error.InvalidLine1;
            return decoded;
        }
        decoded.product = barcode;
        return decoded;
    }

    function processLine2(decoded, type, barcode) {
        decoded.type = type;
        if (barcode.length > 0 && !isNaN(barcode.charAt(0))) {
            if (barcode.length < 5) {
                decoded.error = error.InvalidDate;
                return decoded;
            }
            decoded.date = moment(barcode.substring(0, 5), "YYDDD");
            angular.extend(decoded, decodeLotSerialCheckLink(barcode.substring(5), type, "lot"));
        } else if (barcode.length > 2 && barcode.charAt(0) === "$" && !isNaN(barcode.charAt(1))) {
            angular.extend(decoded, decodeLotSerialCheckLink(barcode.substring(1), type, "lot"));
        } else if (barcode.length > 3 && barcode.substring(0, 2) === "$+" && !isNaN(barcode.charAt(2))) {
            angular.extend(decoded, decodeLotSerialCheckLink(barcode.substring(2), type, "serial"));
        } else if (barcode.length > 3 && barcode.substring(0, 2) === "$$" && !isNaN(barcode.charAt(2))) {
            angular.extend(decoded, decodeLotSerialCheckLink(barcode.substring(2), type, "lot"));
            if (!decoded.error) {
                extractMomentFromString(decoded, "lot", "date");
            }
        } else if (barcode.length > 3 && barcode.substring(0, 3) === "$$+") {
            angular.extend(decoded, decodeLotSerialCheckLink(barcode.substring(3), type, "serial"));
            extractMomentFromString(decoded, "serial", "date");
        } else {
            decoded.error = error.InvalidBarcode;
        }

        return decoded;
    }

    function decodeLotSerialCheckLink(string, barcodeType, propertyName) {
        if (_.isEmpty(string)) {
            return {
                error: error.EmptyCheckCharacter
            };
        }
        var decoded = {};

        decoded.lot = string;
        string = extractQuantityFromString(decoded, string, "quantity");

        // Check character
        decoded.check = string.substring(string.length - 1);
        string = string.substring(0, string.length - 1);

        // LotOrSerial and LinkCharacter
        if (barcodeType === type.Line2) {
            if (_.isEmpty(string)) {
                return {
                    error: error.EmptyLinkCharacter
                };
            }
            decoded.link = string.substring(string.length - 1);
            decoded[propertyName] = string.substring(0, string.length - 1);
        } else {
            decoded[propertyName] = string;
        }

        return decoded;
    }

    function extractMomentFromString(object, stringProperty, momentProperty) {
        var string = object[stringProperty];
        if (!_.isString(string) || _.isEmpty(string)) {
            return;
        }

        var hibcDateFormat = parseInt(string.substring(0, 1), 10);
        if (!_.isNumber(hibcDateFormat)) {
            object["error"] = error.InvalidDate;
            return;
        }

        var dateFormat;
        switch (hibcDateFormat) {
            case 0:
            case 1:
                dateFormat = "MMYY";
                break;
            case 2:
                dateFormat = "MMDDYY";
                break;
            case 3:
                dateFormat = "YYMMDD";
                break;
            case 4:
                dateFormat = "YYMMDDHH";
                break;
            case 5:
                dateFormat = "YYDDD";
                break;
            case 6:
                dateFormat = "YYDDDHH";
                break;
            case 7:
                // no date following the 7

                object[stringProperty] = string.substring(1);
                return;
            default:
                // no date char
                return;
        }

        if (hibcDateFormat > 1) {
            string = string.substring(1);
        }

        if (string.length < dateFormat.length) {
            object["error"] = error.InvalidDate;
            return;
        }

        object[momentProperty] = moment(string.substring(0, dateFormat.length), dateFormat);
        object[stringProperty] = string.substring(dateFormat.length);
    }

    function extractQuantityFromString(object, string, quantityProperty) {
        var i = parseInt(string.charAt(0), 10);
        if (!_.isNumber(i)) {
            return string;
        }

        var length;
        switch (i) {
            case 8:
                length = 2;
                break;
            case 9:
                length = 5;
                break;
            default:
                // no qty
                return string;
        }

        string = string.substring(1);
        var quantity = parseInt(string.substring(0, length), 10);
        string = string.substring(length);

        if (!_.isNumber(quantity)) {
            object["error"] = error.InvalidQuantity;
            return string;
        }

        object[quantityProperty] = quantity;

        return string;
    }

    function isMatch(line1, line2) {
        if (!_.isObject(line1) || line1.type !== type.Line1 || !_.isObject(line2) || line2.type !== type.Line2) {
            return false;
        }

        return line1.check === line2.link;
    }

    function matchesLetters(character) {
        var letters = /^[a-zA-Z]+$/;
        return character.match(letters);
    }

    function matchesNumbers(character) {
        var numbers = /^[0-9]+$/;
        return character.match(numbers);
    }

    /*
     Expose hibc
     */

    this["HIBC"] = {
        decode: decode,
        isMatch: isMatch,
        type: type,
        errors: error
    };

}).call(this);