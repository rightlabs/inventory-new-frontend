// components/Forms/CustomerForm.tsx
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { addCustomer } from "@/api/customer";

interface CustomerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CustomerFormData {
  businessName: string;
  type: "retail" | "wholesale" | "distributor";
  gstin?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  pincode: string;
  creditLimit: number;
  currentBalance?: number;
  paymentTerms?: string;
}

export default function CustomerForm({
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CustomerFormData>();

  const onSubmit = async (data: CustomerFormData) => {
    console.log("====================================");
    console.log(data, "customer data");
    console.log("====================================");
    try {
      const res = await addCustomer(data);

      if (res?.data.statusCode === 200 || res?.data.statusCode === 201) {
        toast.success("Customer created successfully");
        reset();
        onSuccess?.();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create customer"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto">
        {/* Basic Information */}
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Business Name*
            </label>
            <Input
              {...register("businessName", {
                required: "Business name is required",
              })}
              placeholder="Enter business name"
              className={errors.businessName ? "border-red-500" : ""}
            />
            {errors.businessName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.businessName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Customer Type*
              </label>
              <Select
                onValueChange={(value) =>
                  setValue("type", value as CustomerFormData["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">GSTIN</label>
              <Input
                {...register("gstin", {
                  pattern: {
                    value:
                      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                    message: "Invalid GSTIN format",
                  },
                })}
                placeholder="Enter GSTIN (if applicable)"
                className={errors.gstin ? "border-red-500" : ""}
              />
              {errors.gstin && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.gstin.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Contact Person*
              </label>
              <Input
                {...register("contactPerson", {
                  required: "Contact person is required",
                })}
                placeholder="Enter contact person name"
                className={errors.contactPerson ? "border-red-500" : ""}
              />
              {errors.contactPerson && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contactPerson.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Phone Number*
              </label>
              <Input
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Invalid phone number",
                  },
                })}
                placeholder="Enter phone number"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input
              {...register("email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              })}
              type="email"
              placeholder="Enter email"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Address Fields */}
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Address Line 1*
            </label>
            <Input
              {...register("addressLine1", {
                required: "Address is required",
              })}
              placeholder="Building number, Street name"
              className={errors.addressLine1 ? "border-red-500" : ""}
            />
            {errors.addressLine1 && (
              <p className="text-red-500 text-xs mt-1">
                {errors.addressLine1.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Address Line 2
            </label>
            <Input
              {...register("addressLine2")}
              placeholder="Landmark, Area (Optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Input {...register("city")} placeholder="Enter city" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Pincode*</label>
              <Input
                {...register("pincode", {
                  required: "Pincode is required",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "Invalid pincode",
                  },
                })}
                placeholder="Enter pincode"
                maxLength={6}
                className={errors.pincode ? "border-red-500" : ""}
              />
              {errors.pincode && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pincode.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Credit Limit*
              </label>
              <Input
                {...register("creditLimit", {
                  required: "Credit limit is required",
                  min: {
                    value: 0,
                    message: "Credit limit must be positive",
                  },
                })}
                type="number"
                placeholder="Enter credit limit"
                className={errors.creditLimit ? "border-red-500" : ""}
              />
              {errors.creditLimit && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.creditLimit.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Opening Balance
              </label>
              <Input
                {...register("currentBalance", {
                  valueAsNumber: true,
                })}
                type="number"
                placeholder="Enter opening balance"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Payment Terms
            </label>
            <Select onValueChange={(value) => setValue("paymentTerms", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="net15">Net 15</SelectItem>
                <SelectItem value="net30">Net 30</SelectItem>
                <SelectItem value="net45">Net 45</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.gstin
              ? "Please verify the GSTIN number before adding the customer."
              : "Make sure to verify customer details before adding them to the system."}
          </AlertDescription>
        </Alert>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Add Customer</Button>
      </div>
    </form>
  );
}
